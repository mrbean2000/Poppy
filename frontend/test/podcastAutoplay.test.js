const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const babel = require("@babel/core");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

const source = fs.readFileSync(
  path.join(__dirname, "..", "screen", "PodcastPlayerScreen.js"),
  "utf8",
);
const ast = babel.parseSync(source, {
  babelrc: false,
  configFile: false,
  parserOpts: { plugins: ["jsx"] },
});
let autoplayEffect;
let autoplayDependencies;
traverse(ast, {
  CallExpression(path) {
    const node = path.node;
    if (
      node.callee.name === "useEffect" &&
      node.arguments[1]?.type === "ArrayExpression" &&
      node.arguments[1].elements.map((element) => element.name).join(",") ===
        "audioUrl,loadEpisode,player"
    ) {
      autoplayEffect = generate(node.arguments[0]).code;
      autoplayDependencies = node.arguments[1];
    }
  },
});

function setup({ audioUrl = "episode", currentUrl, finished = false, seekTo, load, play } = {}) {
  assert.ok(autoplayEffect, "autoplay effect not found");
  assert.equal(autoplayDependencies.elements.length, 3);
  const calls = [];
  const errors = [];
  const episode = { episodeUrl: audioUrl };
  const channel = {};
  const player = {
    seekTo: seekTo || (async (position) => calls.push(["seek", position])),
    play: play || (() => calls.push(["play"])),
  };
  const loadEpisode = load || ((channel, episode) => {
    calls.push(["load", channel, episode]);
  });
  const effect = vm.runInNewContext(`(${autoplayEffect})`, {
    audioUrl,
    autoplayInputsRef: {
      current: {
        channel,
        episode,
        currentPodcast: currentUrl ? { episode: { episodeUrl: currentUrl } } : null,
        status: { didJustFinish: finished },
      },
    },
    player,
    loadEpisode,
    setPlaybackError: (message) => errors.push(message),
    Error,
  });
  return { effect, calls, errors, channel, episode };
}

test("loads a new episode and starts playback once", () => {
  const screen = setup();
  screen.effect();
  assert.deepEqual(screen.calls, [
    ["load", screen.channel, screen.episode],
    ["play"],
  ]);
  assert.deepEqual(screen.errors, [null]);
});

test("reopening the current episode resumes without resetting its position", () => {
  const screen = setup({ currentUrl: "episode" });
  screen.effect();
  assert.deepEqual(screen.calls.map((call) => call[0]), ["load", "play"]);
});

test("a completed current episode is rewound before playback", async () => {
  const screen = setup({ currentUrl: "episode", finished: true });
  screen.effect();
  assert.deepEqual(screen.calls.map((call) => call[0]), ["load", "seek"]);
  await Promise.resolve();
  assert.deepEqual(screen.calls.map((call) => call[0]), ["load", "seek", "play"]);
  assert.equal(screen.calls[1][1], 0);
});

test("unmounting during a rewind does not start playback", async () => {
  let resolveSeek;
  const screen = setup({
    currentUrl: "episode",
    finished: true,
    seekTo: () => new Promise((resolve) => { resolveSeek = resolve; }),
  });
  const cleanup = screen.effect();
  cleanup();
  resolveSeek();
  await Promise.resolve();
  assert.deepEqual(screen.calls.map((call) => call[0]), ["load"]);
});

test("missing audio is not played and playback errors are surfaced", async () => {
  const missing = setup({ audioUrl: null });
  missing.effect();
  assert.deepEqual(missing.calls, []);
  const failed = setup({ play: () => { throw new Error("Playback failed"); } });
  failed.effect();
  assert.deepEqual(failed.errors, [null, "Playback failed"]);
  const failedSeek = setup({
    currentUrl: "episode",
    finished: true,
    seekTo: () => Promise.reject(new Error("Rewind failed")),
  });
  failedSeek.effect();
  await Promise.resolve();
  assert.deepEqual(failedSeek.errors, ["Rewind failed"]);
});
