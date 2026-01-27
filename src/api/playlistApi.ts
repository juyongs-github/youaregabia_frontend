import axios from "axios";


export const API_SERVER_HOST = "http://localhost:8080/api/playlists";



export const fetchPlaylists = async (): Promise<Playlist[]> => {
    const res= await axios.get(API_SERVER_HOST);
    console.log('플레이리스트 목록', res.data);
    return res.data;
}