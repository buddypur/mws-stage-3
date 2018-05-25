let restaurant;
let reviews;
var map;

const skipLink = document.querySelector(".skip-link");
const name = document.getElementById('restaurant-name');
skipLink.addEventListener('click', function(){
  name.focus();
});

document.addEventListener('DOMContentLoaded', (event) => {
  window.lazySizesConfig = window.lazySizesConfig || {};
  lazySizesConfig.loadMode = 1; // no offscreen images load
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  this.fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new this.google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      this.fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = this.getParameterByName('id');
  if (!id) { // no id found in URL
   let error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchReviews((error, reviews) => {
      self.reviews = reviews.filter(review => review.restaurant_id == id);
    })
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      this.fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lazyload';
  image.setAttribute('alt','Photo of the ' + restaurant.name + ' restaurant');
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  image.tabIndex='0';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    this.fillRestaurantHoursHTML();
  }
  // fill reviews
  this.fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
	hours.tabIndex = '0';
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.tabIndex = '0';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
	noReviews.tabIndex = '0';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(this.createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const header = document.createElement('header');

  const name = document.createElement('p');
  name.className = 'name'
  name.innerHTML = review.name;
  name.tabIndex = '0';
  header.appendChild(name);
  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.className = 'date'
  header.appendChild(date);
  li.appendChild(header);
  
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex = '0';
  rating.className = 'rating'
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = '0';
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb').children[0];
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

function postReview() {
  const id = getParameterByName('id');
  const name = document.getElementById("review-form").elements.namedItem("name").value;
  const rating = document.getElementById("review-form").elements.namedItem("rating").value;
  const comment = document.getElementById("review-form").elements.namedItem("comment").value;
  const review = {
    "restaurant_id": id,
    "name": name.trim(),
    "rating": rating,
    "comments": comment.trim()
  }
  DBHelper.postReview(review);
  location.reload();
}