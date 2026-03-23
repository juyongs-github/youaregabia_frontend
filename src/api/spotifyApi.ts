import axios from "axios";

const spotifyAxios = axios.create({
  baseURL: "",
  timeout: 60000,
});

export const spotifyApi = {
  getToken: () => spotifyAxios.get<{ accessToken: string }>("/spotify/token"),

  getSpotifyTrackId: (trackName: string, artistName: string) => {
    console.log("track-id API 호출:", trackName, artistName);

    return spotifyAxios.get<{ spotifyId: string }>("/spotify/track-id", {
      params: { trackName, artistName },
    });
  },
};
