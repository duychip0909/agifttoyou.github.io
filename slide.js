var swiper = new Swiper(".mainSwiper", {
  direction: "vertical",
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  mousewheel: true,
  effect: 'fade',
  fadeEffect: {
    crossFade: true
  }
});

var swiperKem = new Swiper(".kemSwiper", {
  slidesPerView: 3,
  slidesPerGroup: 1,
  speed: 800,
  loop: true,
  autoplay: {
    delay: 2500,
    disableOnInteraction: true
  }
});