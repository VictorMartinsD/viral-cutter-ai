/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site viral-cutter-ai.
*/

// 1. Variáveis Globais e Seletores de Elementos
const config = {
  cloudName: "df0kqv5py",
  uploadPreset: "upload_nlw",
};

// 2. Funções Principais
const myWidget = cloudinary.createUploadWidget(config, (error, result) => {
  if (!error && result && result.event === "success") {
    console.log("Done! Here is the image info: ", result.info);
  }
});

// 3. Eventos (Clicks, Forms, etc)
document.getElementById("upload_widget").addEventListener(
  "click",
  function () {
    myWidget.open();
  },
  false,
);
