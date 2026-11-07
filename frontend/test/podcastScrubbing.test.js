const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const babel = require("@babel/core");

const source = fs.readFileSync(
  path.join(__dirname, "..", "screen", "PodcastPlayerScreen.js"),
  "utf8",
);
const compiled = babel.transformSync(source, {
  babelrc: false,
  configFile: false,
  plugins: [
    ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
    "@babel/plugin-transform-modules-commonjs",
  ],
}).code;

function createPlayer(duration = 100, platform = "ios", seekImpl = async () => {}) {
  const hooks = [];
  const effects = [];
  const scrollUpdates = [];
  const nativeScrollProps = [];
  const seeks = [];
  const timers = new Map();
  let nextTimerId = 0;
  let hookIndex = 0;
  let tree;
  const episode = { episodeUrl: "audio", trackTimeMillis: duration * 1000 };
  const status = { duration, currentTime: 20, playing: false };
  const player = {
    seekTo: (time) => {
      seeks.push(time);
      return seekImpl(time);
    },
  };
  const react = {
    useState(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (value) => { hooks[index] = value; }];
    },
    useRef(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect(effect, dependencies) {
      const index = hookIndex++;
      const previous = hooks[index];
      if (
        !previous ||
        !dependencies ||
        dependencies.some((value, i) => value !== previous.dependencies[i])
      ) {
        effects.push(() => {
          previous?.cleanup?.();
          hooks[index] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props || {} });
  const native = {
    ActivityIndicator: "ActivityIndicator",
    Image: "Image",
    ImageBackground: "ImageBackground",
    SafeAreaView: "SafeAreaView",
    ScrollView: "ScrollView",
    Text: "Text",
    TouchableOpacity: "TouchableOpacity",
    View: "View",
    StyleSheet: { create: (styles) => styles },
    Platform: { OS: platform },
    PanResponder: {
      create: (config) => ({
        panHandlers: {
          onMoveShouldSetResponder: config.onMoveShouldSetPanResponder,
          onResponderTerminationRequest: config.onPanResponderTerminationRequest,
          onResponderGrant: config.onPanResponderGrant,
          onResponderMove: config.onPanResponderMove,
          onResponderRelease: config.onPanResponderRelease,
          onResponderTerminate: config.onPanResponderTerminate,
        },
      }),
    },
  };
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": native,
    "@expo/vector-icons": { MaterialCommunityIcons: "Icon" },
    "expo-audio": { setAudioModeAsync: async () => {} },
    "../util/http": {
      getPodcastEpisodeTranscriptOrGenerate: () => new Promise(() => {}),
    },
    "../components/PodcastPlaybackContext": {
      usePodcastPlayback: () => ({
        player,
        status,
        currentPodcast: { episode },
        loadEpisode: () => {},
      }),
    },
    "../theme/ThemeContext": {
      useTheme: () => ({ theme: { colors: {} }, isDarkMode: false }),
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name.endsWith(".png")) return name;
      if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
      return modules[name];
    },
    setTimeout: (callback) => {
      const id = ++nextTimerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    console,
  });

  function render() {
    hookIndex = 0;
    tree = module.exports.default({
      navigation: { goBack() {} },
      route: { params: { episode } },
    });
    const scroll = find((node) => node.type === "ScrollView");
    scroll.props.ref.current = {
      setNativeProps: (props) => {
        scrollUpdates.push(props.scrollEnabled);
        nativeScrollProps.push(props);
      },
    };
    while (effects.length) effects.shift()();
  }

  function find(predicate) {
    const queue = [tree];
    while (queue.length) {
      const node = queue.shift();
      if (!node || typeof node !== "object") continue;
      if (predicate(node)) return node;
      const children = node.props?.children;
      if (Array.isArray(children)) queue.push(...children);
      else if (children) queue.push(children);
    }
    throw new Error("Element not found");
  }

  function touchArea() {
    return find((node) => node.props.accessibilityLabel === "Episode progress");
  }

  function layout() {
    find((node) => node.props.style?.width === "100%" && node.props.onLayout)
      .props.onLayout({ nativeEvent: { layout: { width: 200 } } });
    render();
  }

  render();
  return {
    layout,
    render,
    touchArea,
    scroll: () => find((node) => node.type === "ScrollView"),
    scrollUpdates,
    nativeScrollProps,
    seeks,
    status,
    runTimers: () => {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
    },
    unmount: () => hooks.forEach((hook) => hook?.cleanup?.()),
  };
}

function touchEvent(pageX, pageY = 100, locationX = pageX - 100) {
  return { nativeEvent: { pageX, pageY, locationX } };
}

function progressStyles(screen) {
  const track = screen.touchArea().props.children;
  const [fill, thumb] = track.props.children;
  const flatten = (style) => Object.assign({}, ...style.filter(Boolean));
  return {
    track: flatten(track.props.style),
    fill: flatten(fill.props.style),
    thumb: flatten(thumb.props.style),
  };
}

test("scrubbing continues outside the bar until release and clamps at both ends", () => {
  const screen = createPlayer();
  screen.layout();
  assert.equal(progressStyles(screen).track.height, 4);
  assert.equal(progressStyles(screen).fill.height, 4);
  assert.equal(progressStyles(screen).thumb.top, -4);
  let touch = screen.touchArea().props;
  touch.onTouchStart(touchEvent(150));
  assert.equal(touch.onMoveShouldSetResponder({}, { dx: 10, dy: 2 }), true);
  assert.equal(touch.onResponderTerminationRequest(), false);
  touch.onResponderGrant(touchEvent(150));
  screen.render();
  assert.equal(screen.scroll().props.scrollEnabled, false);
  assert.equal(screen.scroll().props.canCancelContentTouches, false);
  assert.equal(screen.touchArea().props.accessibilityValue.now, 25);
  assert.equal(progressStyles(screen).track.height, 14);
  assert.equal(progressStyles(screen).fill.height, 14);
  assert.equal(progressStyles(screen).thumb.top, 1);

  touch = screen.touchArea().props;
  touch.onResponderMove({ nativeEvent: { pageY: 800 } }, { moveX: 350 });
  screen.render();
  assert.equal(screen.touchArea().props.accessibilityValue.now, 100);
  touch.onResponderMove({ nativeEvent: { pageY: 0 } }, { moveX: 50 });
  screen.render();
  assert.equal(screen.touchArea().props.accessibilityValue.now, 0);
  touch.onResponderMove({}, { moveX: 220 });
  screen.render();
  assert.equal(screen.touchArea().props.accessibilityValue.now, 60);
  assert.deepEqual(screen.seeks, []);

  touch.onTouchEnd(touchEvent(220));
  assert.deepEqual(screen.scrollUpdates, [false]);
  touch.onResponderRelease();
  screen.render();
  assert.deepEqual(screen.seeks, [60]);
  assert.equal(screen.touchArea().props.accessibilityValue.now, 60);
  assert.equal(screen.scroll().props.scrollEnabled, true);
  assert.equal(screen.scroll().props.canCancelContentTouches, true);
  assert.equal(progressStyles(screen).track.height, 4);
  assert.equal(progressStyles(screen).fill.height, 4);
  assert.equal(progressStyles(screen).thumb.top, -4);
  assert.deepEqual(screen.scrollUpdates, [false, true]);
  assert.equal(screen.nativeScrollProps[0].canCancelContentTouches, false);
  assert.equal(screen.nativeScrollProps[1].canCancelContentTouches, true);
  screen.unmount();
});

test("termination preserves and seeks to the dragged position", async () => {
  const screen = createPlayer();
  screen.layout();
  const touch = screen.touchArea().props;
  touch.onTouchStart(touchEvent(150));
  touch.onResponderGrant(touchEvent(150));
  screen.render();
  assert.equal(progressStyles(screen).track.height, 14);
  touch.onResponderMove({}, { moveX: 280 });
  touch.onTouchCancel();
  assert.deepEqual(screen.scrollUpdates, [false]);
  touch.onResponderTerminate();
  screen.render();
  assert.deepEqual(screen.seeks, [90]);
  assert.equal(screen.touchArea().props.accessibilityValue.now, 90);
  assert.equal(screen.scroll().props.scrollEnabled, true);
  assert.equal(progressStyles(screen).track.height, 4);
  assert.equal(progressStyles(screen).fill.height, 4);
  assert.deepEqual(screen.scrollUpdates, [false, true]);
  await Promise.resolve();
  screen.status.currentTime = 90;
  screen.render();
  screen.render();
  assert.equal(screen.touchArea().props.accessibilityValue.now, 90);
  screen.unmount();
});

test("a pending seek retains the target even when the status is slow", async () => {
  let completeSeek;
  const screen = createPlayer(
    100,
    "ios",
    () => new Promise((resolve) => { completeSeek = resolve; }),
  );
  screen.layout();
  const touch = screen.touchArea().props;
  touch.onTouchStart(touchEvent(150));
  touch.onResponderGrant(touchEvent(150));
  touch.onResponderMove({}, { moveX: 280 });
  touch.onResponderTerminate();
  screen.render();
  screen.runTimers();
  screen.render();
  assert.equal(screen.touchArea().props.accessibilityValue.now, 90);
  completeSeek();
  await Promise.resolve();
  screen.render();
  screen.runTimers();
  screen.render();
  assert.equal(screen.touchArea().props.accessibilityValue.now, 20);
  screen.unmount();
});

test("a vertical scroll is not captured or interpreted as a tap", () => {
  const screen = createPlayer();
  screen.layout();
  const touch = screen.touchArea().props;
  touch.onTouchStart(touchEvent(150));
  assert.equal(touch.onMoveShouldSetResponder({}, { dx: 2, dy: 10 }), false);
  assert.equal(touch.onMoveShouldSetResponder({}, { dx: 5, dy: -5 }), false);
  touch.onTouchMove(touchEvent(152, 120));
  touch.onTouchEnd(touchEvent(152, 120));
  assert.deepEqual(screen.seeks, []);
  assert.deepEqual(screen.scrollUpdates, []);
  assert.equal(screen.scroll().props.scrollEnabled, true);
});

test("tap seeks and an unmounted scrub restores scrolling", () => {
  const screen = createPlayer();
  screen.layout();
  const touch = screen.touchArea().props;
  touch.onTouchStart(touchEvent(200));
  touch.onTouchEnd(touchEvent(200));
  assert.deepEqual(screen.seeks, [50]);
  assert.deepEqual(screen.scrollUpdates, []);
  touch.onTouchStart(touchEvent(150));
  touch.onResponderGrant(touchEvent(150));
  screen.unmount();
  assert.deepEqual(screen.scrollUpdates, [false, true]);
});

test("a progress bar without duration or layout does not lock scrolling", () => {
  const noDuration = createPlayer(0);
  noDuration.layout();
  noDuration.touchArea().props.onTouchStart(touchEvent(150));
  assert.equal(
    noDuration.touchArea().props.onMoveShouldSetResponder({}, { dx: 10, dy: 0 }),
    false,
  );
  assert.deepEqual(noDuration.scrollUpdates, []);

  const noLayout = createPlayer();
  noLayout.touchArea().props.onTouchStart(touchEvent(150));
  assert.equal(
    noLayout.touchArea().props.onMoveShouldSetResponder({}, { dx: 10, dy: 0 }),
    false,
  );
  assert.deepEqual(noLayout.scrollUpdates, []);
});

test("Android scrubbing does not set the iOS-only native scroll property", () => {
  const screen = createPlayer(100, "android");
  screen.layout();
  const touch = screen.touchArea().props;
  touch.onTouchStart(touchEvent(150));
  touch.onResponderGrant(touchEvent(150));
  touch.onResponderMove({}, { moveX: 350 });
  touch.onResponderRelease();
  assert.deepEqual(screen.seeks, [100]);
  assert.equal("canCancelContentTouches" in screen.nativeScrollProps[0], false);
  assert.equal("canCancelContentTouches" in screen.nativeScrollProps[1], false);
});
