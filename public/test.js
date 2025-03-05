console.log('I am updated');

  // Listen for messages
  if (window.electron) {
    console.log(window.electron);
    
    window.electron.receive("message", (data) => {
        console.log("Updater dan xabar:", data);
    });
} else {
    console.error("Electron API preload.js orqali yuklanmadi!");
}
