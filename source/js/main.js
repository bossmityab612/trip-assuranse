import bar from './bar.js';
import './swiper.js';

bar();

document.addEventListener('DOMContentLoaded', () => {
  let getURL = function (linkURL, callback) {
    let headContainer = document.querySelector('head');

    const script = document.createElement('script');

    script.type = 'javascript';
    script.src = '/headLinks.js';
    script.onload = () => {
      if (callback) callback();
      resolve();
    };

    headContainer.appendChild(script);

    return linkURL;
  }

  getURL();
});

