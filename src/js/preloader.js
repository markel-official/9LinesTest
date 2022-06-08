/**
*  Added script as "defer" to head in order to initiate the preloader logic first
*
*   --------------------------
*
*  We're using "setInterval" instead of "requestAnimationFrame" in preloader for a number of reasons:
*       1) Since preloader will only be downloaded once - we want to clean interval and don't execute
*           code that we don't need
*       2) I decided to use animation down below so I will use "requestAnimationFrame" further
*           however preloader's script must have been downloaded and executed first
*
*
*
**/
//

/**
*  setTimeout via promise
**/
function delay(ms) {
	return new Promise((resolve, reject) => { // eslint-disable-line
		setTimeout(resolve, ms);
	});
}

/**
*  LERP
// Stands for linear interpolation between provided values - in order to "damp" transition
//      and make it more smooth
**/
//
function lerp(start, end, amt) {
	return (1 - amt) * start + amt * end;
}

let preloaderElement = null;
let isWebsiteLoaded = false;

// This is setInterval
// We will clear it when preloader will be loaded
let smoothPreloaderAnimation = null;

let promiseResolve = null;
let promiseReject = null;

document.addEventListener('DOMContentLoaded', () => {
	preloaderElement = document.querySelector('.preloader');

	function initPreloader() {
		// Preloader script
		let timer = new Promise((resolve) => {
			setTimeout(resolve, 2000);
		});

		let isLoaded = new Promise((resolve, reject) => { // eslint-disable-line
			promiseResolve = resolve;
			promiseReject = resolve;
		});

		/**
         * Sizes
        */
		const sizes = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		/**
        *  Variables
        **/
		//
		// Dynamic variable root (have all styles and updating automatically)
		const root = document.querySelector(':root');
		const rootStyles = getComputedStyle(root);

		const preloaderPos = {
			x: parseInt(rootStyles.getPropertyValue('--prealoder-x').trim(), 10),
			y: parseInt(rootStyles.getPropertyValue('--prealoder-y').trim(), 10),
		};
		const preloaderPosSmooth = {
			x: parseInt(rootStyles.getPropertyValue('--prealoder-x').trim(), 10),
			y: parseInt(rootStyles.getPropertyValue('--prealoder-y').trim(), 10),
		};

		/**
        *  Handle preloader
        *  Since we are using global animate function to animate prealoder
        *  on a loading I decided to put this function here
        **/
		//
		let downloadProgress = 0;

		let distanceToMoveX = null;
		let distanceToMoveY = null;

        const movingElement = preloaderElement.querySelector('.js-person');
        distanceToMoveX = Number(sizes.width) + Number(movingElement.offsetWidth) * 1.5;
        distanceToMoveY = Number(sizes.height) + Number(movingElement.offsetHeight);

        // Total amount of images
        const imagesArray = document.querySelectorAll('img:not(.js-preloader-image)');
        const imagesCount = imagesArray.length;

        let loadedImage = 0;

        // Percentage per image
        const percentagePerImage = 100 / imagesCount / 100;

        // Update position and set it to variables
        function updatePreloaderPersonPosition() {
            // Update coordinates
            preloaderPosSmooth.x = lerp(preloaderPosSmooth.x, preloaderPos.x, 0.5);
            preloaderPosSmooth.y = lerp(preloaderPosSmooth.y, preloaderPos.y, 0.5);

            // Set preloader displacement
            root.style.setProperty('--prealoder-x', `${preloaderPosSmooth.x}px`);
            root.style.setProperty('--prealoder-y', `${preloaderPosSmooth.y}px`);
        }

        // Load image function
        function img_load() {
            downloadProgress += percentagePerImage;
            loadedImage++;

            preloaderPos.x = downloadProgress * distanceToMoveX;
            preloaderPos.y = downloadProgress * distanceToMoveY;

            // Update position
            updatePreloaderPersonPosition();

            // All images has been loaded
            if (downloadProgress >= 1 || loadedImage === imagesCount) {
                isWebsiteLoaded = true;
            }
        }

        function move() {
            // Animation here
            // Update position
            updatePreloaderPersonPosition();

            if (isWebsiteLoaded) {
                // Make sure that interpolation has finished!
                // Since boolean flag might be true which means
                // preloader has been loaded
                if (Math.abs(preloaderPosSmooth.x - preloaderPos.x) < 5) {
                    // RESOLVE HERE
                    promiseResolve();
                }
            }
        }

        // Set interval with update every 25ms which will provide 40FPS
        // 1000ms / 40 FPS = frequency is 25
        smoothPreloaderAnimation = setInterval(move, 25);

        for (let i = 0; i < imagesCount; i++) { // Clone images
            let imgCopy = new Image();
            imgCopy.src = document.images[i].src;
            imgCopy.onload = img_load;
            imgCopy.onerror = img_load;
        }

        // Resolve only after:
        // minimal time will be finished
        // Element will be loaded
        return Promise.all([
            timer,
            isLoaded,
        ]);
	}

	if (!(localStorage.getItem('showPreloader') == 'false')) {
		// show preloader
		initPreloader().then(() => {
			if (preloaderElement) {
				// Hide preloader
				preloaderElement.classList.add('preloader--loaded');
				delay(500)
					.then(() => {
						// Make it unaccessible
						preloaderElement.classList.add('preloader--hidden');

						clearInterval(smoothPreloaderAnimation);
					});

				localStorage.setItem('showPreloader', 'false');
			}
		});
	} else {
		if (preloaderElement) {
			preloaderElement.classList.add('preloader--loaded');
			preloaderElement.classList.add('preloader--hidden');
		}

		if (smoothPreloaderAnimation) {
			clearInterval(smoothPreloaderAnimation);
		}
	}
});
