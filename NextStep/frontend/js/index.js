// Ensure the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Script loaded');  // Debugging log

  // Redirect to login page when Find Job button is clicked
  document.getElementById('findJobBtn').addEventListener('click', function() {
    console.log('Find Job button clicked');
    window.location.href = 'login.html';  // This will redirect to login page
  });

  // Redirect to login page when Post Job button is clicked
  document.getElementById('postJobBtn').addEventListener('click', function() {
    console.log('Post Job button clicked');
    window.location.href = 'login.html';  // This will redirect to login page
  });

  // Counter animation code
  const counters = document.querySelectorAll('.number');

  // Function to animate counters
  const animateCounter = (counter, start, end, duration) => {
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const current = Math.min(Math.floor(progress / duration * (end - start) + start), end);
      counter.textContent = current;

      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        counter.textContent = end; // Ensure the counter ends at the exact value
      }
    };

    requestAnimationFrame(step);
  };

  // Function to trigger animations for each counter with the target value
  const triggerCounterAnimations = () => {
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-number'); // Get the target number from data attribute
      animateCounter(counter, 0, target, 2000); // Animate over 2 seconds
    });
  };

  // Trigger animations immediately on page load
  triggerCounterAnimations();

  // Add hover event to start animation when section is hovered
  const sectionCounter = document.querySelector('.section-counter');

  sectionCounter.addEventListener('mouseenter', function() {
    triggerCounterAnimations();
  });
});
