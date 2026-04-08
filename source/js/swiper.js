import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

document.addEventListener("DOMContentLoaded", () => {
  const swiper = new Swiper(".swiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    navigation: false,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });

  const prevBtn = document.querySelector('.swiper-button-prev');
  const nextBtn = document.querySelector('.swiper-button-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      swiper.slidePrev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      swiper.slideNext();
    });
  }
});
