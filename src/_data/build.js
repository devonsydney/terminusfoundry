// Build-time values. The year goes into the guide footer ("Terminus Foundry © YYYY"); it's the build date's year.
export default {
  year: new Date().getUTCFullYear(),
  date: new Date().toISOString().slice(0, 10),
};
