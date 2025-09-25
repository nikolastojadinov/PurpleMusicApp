// Pi Network SDK loader for web
// This script should be loaded in public/index.html or dynamically in React

export function loadPiSDK(onLoad) {
  if (window.Pi) {
    onLoad(window.Pi);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://sdk.minepi.com/pi-sdk.js';
  script.async = true;
  script.onload = () => {
    onLoad(window.Pi);
  };
  document.body.appendChild(script);
}

// Example usage:
// loadPiSDK((Pi) => { /* Pi.login(), Pi.createPayment(), ... */ });
