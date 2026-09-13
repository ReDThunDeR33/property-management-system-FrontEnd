import axios from "axios";

/* ------------------------------------------------------------
   Axios instance (Course requirement: "Use Axios only for backend
   communication — fetch is not allowed").
   Every page/component imports this shared instance so the
   baseURL is configured in ONE place (course: Axios.pptx shows
   axios.get/post/put/delete against a fixed backend origin).
   ------------------------------------------------------------ */
const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
