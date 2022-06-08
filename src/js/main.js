import './vendor';
import './helpers';
import './components/social';
import {ieFix} from './vendor/ie-fix';
import {vhFix} from './vendor/vh-fix';
import header from './components/header';
// import preloader from './components/preloader';
import lazyLoading from './modules/lazyLoading';
import scrollToAnchor from './modules/scrollToAnchor';

ieFix();
vhFix();
scrollToAnchor.init();

header.init();
lazyLoading.init();

import LocomotiveScroll from 'locomotive-scroll';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger.js';
gsap.registerPlugin(ScrollTrigger);

import * as THREE from 'three';

import Sharer from 'sharer.js'; // eslint-disable-line
import html2canvas from 'html2canvas';

/**
 * Sizes
*/
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

/**
*  Root - using it to set variables via JS
**/
const ROOT = document.querySelector(':root');
const rootStyles = getComputedStyle(ROOT);

// Debounce function - apply to frequently fired events
function debounce(func, wait, immediate) {
	let timeout;

	return () => {
		let context = this;
        let args = arguments; // eslint-disable-line

		let later = () => {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};

		let callNow = immediate && !timeout;

		clearTimeout(timeout);

		timeout = setTimeout(later, wait);

		if (callNow) {
			func.apply(context, args);
		}
	};
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

/**
*   This function creates temporary canvas to read data from the image
*   and use it on the canvas which displays our WebGL animation
*   @param {Image} Image which we are going to place on a canvas
*   @returns {Array} Array which contains array of coordinates as a first element and array of colors as a
*    second element
**/
//
function initTemporaryCanvas(img) {
	let size = null;

	if (sizes.width < 650) {
		size = 75;
	} else {
		size = 100;
	}
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	canvas.width = size;
	canvas.height = size;

	canvas.classList.add('tempcanvas');
	document.body.appendChild(canvas);

	let imageCoords = [];
	let imageCoordsColors = [];
	let data = null;

	// img.onload = function () {
	// }
	ctx.clearRect(0, 0, size, size);
	ctx.drawImage(img, 0, 0, size, size);
	data = ctx.getImageData(0, 0, size, size);
	data = data.data;

	// Traverse all data from array
	// Pick red, green and blue colors and point's coordinate data
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			let red = data[(size * y + x) * 4];
			let green = data[(size * y + x) * 4 + 1];
			let blue = data[(size * y + x) * 4 + 2];
			let alpha = data[(size * y + x) * 4 + 3];
			// console.log(red, green, blue, alpha)
			if (alpha > 0) {
				imageCoords.push([4 * (x - size / 2), 4 * (size / 2 - y)]);
				imageCoordsColors.push([red, green, blue]);
			}
		}
	}

	let resultArr = [];
	resultArr.push(imageCoords);
	resultArr.push(imageCoordsColors);

	return resultArr;
}

/**
*  Initialize canvas with Three.js
**/
//
let camera; let scene; let renderer; let geometry; let
	mainCanvas;
function initThreeJS() {
	let imageInput = document.getElementById('footer-image');

	const footerImgData = initTemporaryCanvas(imageInput);

	mainCanvas = document.querySelector('canvas.webgl');

	scene = new THREE.Scene();

	/**
     * Renderer
     */
	renderer = new THREE.WebGLRenderer({
		canvas: mainCanvas,
		alpha: true,
	});

	if (sizes.width < 650) {
		renderer.setSize(300, 170);
	} else {
		renderer.setSize(500, 300);
	}
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 1, 700);

	if (sizes.width < 650) {
		camera.position.z = 350;
	} else {
		camera.position.z = 300;
	}

	let texture = new THREE.TextureLoader().load('./images/particle.png');
	let material = new THREE.PointsMaterial({
		size: 5,
		color: new THREE.Color('#fff'),
		vertexColors: THREE.VertexColors,
		map: texture,
		transparent: true,
		alphaMap: texture,
	});
	material.vertexColors = true;

	geometry = new THREE.Geometry();

	footerImgData[0].forEach((el) => {
		geometry.vertices.push(new THREE.Vector3(el[0], el[1], Math.random() * 60));
	});
	footerImgData[1].forEach((el) => {
		geometry.colors.push(new THREE.Color(`rgb(${el[0]},${el[1]},${el[2]})`));
	});

	let pointCloud = new THREE.Points(geometry, material);
	scene.add(pointCloud);

	camera.lookAt(pointCloud.position);
	scene.add(camera);

	// Cursor
	const cursor = {
		x: 0,
		y: 0,
	};
	window.addEventListener('mousemove', (event) => {
		cursor.x = event.clientX / sizes.width - 0.5;
		cursor.y = -(event.clientY / sizes.height - 0.5);
	});

	let animationCounter = 0;
	const animate = () => {
		// Update camera
		camera.position.x = cursor.x * 200;
		camera.position.y = cursor.y * 200;
		camera.lookAt(pointCloud.position);

		// Render
		renderer.render(scene, camera);

		if (geometry.vertices) {
			geometry.vertices.forEach((particle, index) => {
				particle.x += Math.cos(animationCounter / 10 + index) / 15;
				particle.y += Math.sin(animationCounter / 10 + index) / 15;
			});
		}
		geometry.verticesNeedUpdate = true;

		animationCounter++;

		// Call animate again on the next frame
		window.requestAnimationFrame(animate);
	};
	animate();
}

// eslint-disable-next-line
(function () {
	/**
     * SMOOTH SCROLL
     * and
     * GSAP ANIMATION
    **/
	// Register GSAP Plugins
	let maximumScroll = 0;
	let scrollDistance = 0;
	let scrollProgress = 0;

	const smoothScrollContainer = document.getElementById('scroll-container');

	const locoScroll = new LocomotiveScroll({
		el: smoothScrollContainer,
		smooth: true,
		mobile: {
			smooth: true,
		},
		tablet: {
			smooth: true,
		},
	});

    // tell ScrollTrigger to use these proxy methods for the "#scroll-container"
    //  element since Locomotive Scroll is hijacking things
	ScrollTrigger.scrollerProxy('#scroll-container', {
		scrollTop(value) {
			return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
		}, // we don't have to define a scrollLeft because we're only scrolling vertically.
		getBoundingClientRect() {
			return {top: 0,
				left: 0,
				width: window.innerWidth,
				height: window.innerHeight};
		},
		// LocomotiveScroll handles things completely differently on mobile devices -
        // it doesn't even transform the container at all! So to get the correct behavior
        // and avoid jitters, we should pin things with position: fixed on mobile.
        // We sense it by checking to see if there's a transform applied to the container
        //  (the LocomotiveScroll-controlled element).
		pinType: document.querySelector('#scroll-container').style.transform ? 'transform' : 'fixed',
	});

    /**
    *  Handle header scroll
    **/
	// Add modificator to header when scroll more than 200px from top
	const headerElement = document.querySelector('.header');
	function handleHeader() {
		if (headerElement) {
			if (scrollDistance > 200) {
				headerElement.classList.add('header--active');
			} else {
				headerElement.classList.remove('header--active');
			}
		}
	}

    /**
    *  Update progress
    **/
	// If we reached the bottom of the website then
	// add "--full" modificator to a progress-tracker
	const progressTrackerEl = document.querySelector('.progress-tracker');
	const progressTrackerOutput = progressTrackerEl.querySelector('.progress-tracker__progress-output');

	function updateProgress() {
		if (progressTrackerEl) {
			progressTrackerOutput.textContent = scrollProgress;
			if (scrollProgress >= 99) {
				progressTrackerEl.classList.add('progress-tracker--full');
			} else {
				progressTrackerEl.classList.remove('progress-tracker--full');
			}
		}
	}

	locoScroll.on('scroll', (args) => {
		ScrollTrigger.update;

		scrollDistance = Number(args.scroll.y);
		maximumScroll = Number(args.limit.y);

		scrollProgress = (scrollDistance / maximumScroll * 100).toFixed(0);

		handleHeader();
		updateProgress();
	});

	if (headerElement) {
		/**
        *  Handle header menu
        **/
		//
		const menuElement = headerElement.querySelector('.js-menu');
		const openMenuBtn = headerElement.querySelector('.js-open-menu');
		const closeMenuBtn = headerElement.querySelector('.js-close-menu');

		if (openMenuBtn) {
			openMenuBtn.addEventListener('click', () => {
				menuElement.classList.add('menu--open');
			});
		}

		if (closeMenuBtn) {
			closeMenuBtn.addEventListener('click', () => {
				menuElement.classList.remove('menu--open');
			});
		}
	}

	/**
    *  Handle locomotive scroll
    * Apparently locomotive scroll just has been updated and their removed "data-scroll-to"
    * functionality.
    * So I had to create this little script
    **/
	//
	const anchorLinksArr = document.querySelectorAll('.js-target-pointer');
	if (anchorLinksArr) {
		anchorLinksArr.forEach((anchorLink) => {
			anchorLink.addEventListener('click', () => {
				const anchorParentEl = anchorLink.closest('.menu-list__item');
				if (anchorParentEl) {
					anchorParentEl.classList.add('menu-list__item--active');
				}

				anchorLinksArr.forEach((linkToCompare) => {
					if (linkToCompare !== anchorLink) {
						const linkToCompareParentEl = linkToCompare.closest('.menu-list__item');
						if (linkToCompareParentEl) {
							linkToCompareParentEl.classList.remove('menu-list__item--active');
						}
					}
				});

				// e.preventDefault();
				const targetBlock = anchorLink.getAttribute('data-target-to');

				const targetEl = document.getElementById(targetBlock);

				if (targetEl) {
					locoScroll.scrollTo(targetEl);

					const menuElement = anchorLink.closest('.js-menu');

					if (menuElement) {
						setTimeout(() => {
							menuElement.classList.remove('menu--open');
						}, 800);
					}
				}
			});
		});
	}


	/**
    *  Handle intersection's SVGs
    * (since with provided SVG I couldn't use stroke-dashoffset/stroke-dasharray) technique to create
    * drawing effect (different SVG needed, you can check it yourself)
    **/
	//
	const intersectionSVGArr = document.querySelectorAll('.intersection-svg-wrapper');
	if (intersectionSVGArr) {
		intersectionSVGArr.forEach((intersectionEl) => {
			gsap.to(intersectionEl, {
				scrollTrigger: {
					// Element | Screen
					trigger: intersectionEl,
					scroller: '#scroll-container',
					// duration: 1,
					start: 'center bottom-=100px',
					end: 'bottom center',
					scrub: 0.5,
					toggleActions: 'play pause resume reset',
					markers: false,
					onUpdate: (trigger) => {
						intersectionEl.style.setProperty('--intersection-intro-scale', `${100 - trigger.progress * 100}%`);
					},
				},
			});
		});
	}

	

	let personAnimationTween = null;
	let personCurrentRotation = 0;
	let personPreviosValue = parseInt(rootStyles.getPropertyValue('--object-rotation'), 10);

    function smoothPersonTransition() {
		const currentValue = lerp(personCurrentRotation, personPreviosValue, 0.5);
		ROOT.style.setProperty('--object-rotation', `${currentValue}deg`);
	}

	function initAboutAnimation() {
        let personTween = null;
		// Activate pinnign and animation only on screens greater than 750px
		if (sizes.width > 750) {
			/**
            *  Handle person movement
            *  Added update function with lerp to gsap.tick in order to interpolate on every frame
            *       instead of calculating it on every time scrollTrigger updates
            *       (In order to achieve smoother animation)
            **/
			//
			const personAnimationWrapper = document.querySelector('.about__col-animation');

			if (personAnimationWrapper) {
				const personEl = personAnimationWrapper.querySelector('.js-person');

				const trackerParentSize = parseInt(personAnimationWrapper.offsetHeight, 10);
				const personElSize = parseInt(personEl.offsetHeight, 10);

				const ROTATION = 360; // in degrees

				personTween = gsap.to(personEl, {
					paused: true,
					scrollTrigger: {
						scroller: '#scroll-container',
						trigger: personAnimationWrapper,
						pin: personEl,
						pinSpacing: true,
						// markers: true,
						start: 'top center',
						end: `top+=${trackerParentSize - personElSize / 2}px center`,
						// end: `top+=${trackerParentSize}px center`,
						scrub: 0.1,
						// start: `top top+=${trackerGap}px`,
						// end: `+=${trackerParentSize - roadmapColumnsGap - trackerElSize / 2}`,
						onUpdate: (trigger) => {
							// console.log(trigger.progress)
							personCurrentRotation = ROTATION * trigger.progress;
						},
						// onUpdate: function() {
						//   console.log(this.progress()) // Goes from 0 to 1
						// },
						// end: 'bottom',
						// endTrigger: trackerParent
					},
				});
			}

			gsap.ticker.add(smoothPersonTransition);
		}

		return personTween;
	}
	personAnimationTween = initAboutAnimation();

	function discardAboutAnimation(tweenToKill) {
		if (tweenToKill) {
			tweenToKill.kill();
		}
		if (gsap.ticker) {
			gsap.ticker.remove(smoothPersonTransition);
		}
	}

	/**
    *  Create three.js scene for footer
    * p.s. I know it was unnecessary but I just wanted to create something original instead of just
    * putting boring image (which is not even SVG)
    **/
	// Let time for preloader to load and discard the timeinterval
	setTimeout(() => {
		initThreeJS();
	}, 3000);

	/**
    *  Handle sharing
    *  I'm using sharer.js library
    **/
	//  https://ellisonleao.github.io/sharer.js/#twitter
	let url = window.location.href;
	let urlShare = `${window.location.href}share.php`;
	let title = document.querySelector('.js-share-title').textContent.trim();
	let caption = document.querySelector('.js-share-subject').textContent.trim();

	$('meta[property=\'og:image\']').attr('content', `${url}preview.jpg`);
	$('meta[property=\'og:url\']').attr('content', `${url}`);

	// $(`meta[property=\\og:image]`).attr('content', `${url}preview.jpg`);
	// $(`meta[property=\\og:url]`).attr('content', `${url}`);

	// fb
	$('#share-fb').attr('data-url', url).attr('data-sharer', 'facebook').attr('data-title', title);
	// vk
	$('#share-vk').attr('data-url', url).attr('data-sharer', 'vk').attr('data-title', title).attr('data-caption', caption);
	// telegram
	$('#share-tg').attr('data-url', url).attr('data-sharer', 'telegram').attr('data-title', title);

    /**
    *  Update preview photo on the server
    **/
    //
    function saveToServer(image) {
		$('meta[property=\'og:image\']').attr('content', `${url}preview.jpg`);
		$('meta[property=\'og:url\']').attr('content', `${url}`);

		// $(`meta[property=\\og:image]`).attr('content', `${url}preview.jpg`);
		// $(`meta[property=\\og:url]`).attr('content', `${url}`);

		let formData = new FormData();
		formData.append('image', image);

		$.ajax({
			url: urlShare,
			type: 'POST',
			data: formData,
			contentType: false,
			cache: false,
			processData: false,
			success(data) {
				// console.log(data);
			},
			error(data) {
				// console.log(data);
			},
		});
	}

	/**
    *  Make a screenshot
    **/
	//
	// Prevent basic click behavior
	let previewImg = new Image();
	// let previewImgString = '';
	const sharingButtons = document.querySelectorAll('.intro__social-icon');
	if (sharingButtons) {
		sharingButtons.forEach((shareBtn) => {
			shareBtn.addEventListener('click', (e) => {
				e.preventDefault();

				html2canvas(document.querySelector('#intro')).then((canvas) => {
					// // document.body.appendChild(canvas)
					// previewImgString = canvas.toDataURL('image/jpeg');

					// previewImg.href = previewImgString;
					// previewImg.src = `${url}preview.jpg`;
					previewImg.src = canvas.toDataURL('image/jpeg');
					previewImg.crossOrigin = 'anonymous';

					saveToServer(previewImg);
				});
			});
		});
	}


	// each time the window updates, we should refresh ScrollTrigger and then update LocomotiveScroll.
	ScrollTrigger.addEventListener('refresh', () => locoScroll.update());

	// after everything is set up, refresh() ScrollTrigger and update LocomotiveScroll
    // because padding may have been added for pinning, etc.
	ScrollTrigger.refresh();

	/**
    *  Add resize event listener
    **/
	// We are using debounce for functions which fires frequently
	window.addEventListener('resize', debounce(() => {
		// Update sizes
		sizes.width = window.innerWidth;
		sizes.height = window.innerHeight;

		discardAboutAnimation(personAnimationTween);
		personAnimationTween = initAboutAnimation();

		ScrollTrigger.addEventListener('refresh', () => locoScroll.update());

		ScrollTrigger.refresh();
	}, 1500));
})();
