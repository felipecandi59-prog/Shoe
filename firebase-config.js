const firebaseConfig = {

    apiKey: "AIzaSyCcJZKUtXfp4g0vWGO3SmCtnqDfEwY7PyQ",
  authDomain: "shoe-5873a.firebaseapp.com",
  projectId: "shoe-5873a",
};
firebaseConfig.initializeApp(firebaseConfig);
const auth = firebaseConfig.auth();
const db = firebaseConfig.firestore();

const storage = firebase.storage();