export const profilePictures = [
  {
    uri: "poppy-mascot://poppy_raincoat",
    label: "Raincoat",
    source: require("../assets/images/masot/poppy_raincoat.jpeg"),
  },
  {
    uri: "poppy-mascot://poppy_music",
    label: "Music",
    source: require("../assets/images/masot/poppy_music.png"),
  },
  {
    uri: "poppy-mascot://poppy_podcast",
    label: "Podcast",
    source: require("../assets/images/masot/poppy_podcast.png"),
  },
  {
    uri: "poppy-mascot://poppy_superman",
    label: "Superman",
    source: require("../assets/images/masot/poppy_superman.png"),
  },
  {
    uri: "poppy-mascot://poppy_wonderwoman",
    label: "Wonder Woman",
    source: require("../assets/images/masot/poppy_wonderwoman.png"),
  },
  {
    uri: "poppy-mascot://poppy_batman",
    label: "Batman",
    source: require("../assets/images/masot/poppy_batman.png"),
  },
  {
    uri: "poppy-mascot://poppy_keepstreak",
    label: "Keep streak",
    source: require("../assets/images/masot/poppy_keepstreak.png"),
  },
  {
    uri: "poppy-mascot://poppy_passingexam",
    label: "Passing exam",
    source: require("../assets/images/masot/poppy_passingexam.png"),
  },
  {
    uri: "poppy-mascot://poppy_trophy",
    label: "Trophy",
    source: require("../assets/images/masot/poppy_trophy.png"),
  },
  {
    uri: "poppy-mascot://poppy_notification",
    label: "Reminder",
    source: require("../assets/images/masot/poppy_notification.png"),
  },
];

export function getProfilePictureSource(uri, fallbackUri) {
  const picture = profilePictures.find((item) => item.uri === uri);
  if (picture) return picture.source;
  if (uri && !uri.startsWith("poppy-mascot://")) return { uri };
  if (!uri && fallbackUri) return { uri: fallbackUri };
  return profilePictures[0].source;
}