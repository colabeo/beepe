var xDirection = require('famous/utilities/utility').Direction.X;

module.exports = {
    debug: false,
    header: {
        look: {
            classes: ['header'],
            size: [undefined, 50],
            side: 'top'
        },
        feel: {
            inTransition : {
                method : 'wall',
                period : 300,
                dampingRatio : 0,
                restitution : .2
            },
            outTransition: {
                method : 'spring',
                period : 300,
                dampingRatio : .5,
                velocity : 0
            },
            overlap: true
        }
    },
    navigation:{
        look: {
            side: 'bottom',
            direction: xDirection,
            size: [undefined, 50],
            onClasses: ['navigation', 'on'],
            offClasses: ['navigation', 'off']
        },
        feel: {
            inTransition: {
                curve: 'easeInOut',
                duration: 150
            },
            outTransition: {
                curve: 'easeInOut',
                duration: 150
            }
        }
    },
    content: {
        feel: {
            inTransition : {
                method : 'spring',
                period : 1000,
                dampingRatio : .5,
                velocity : 0
            },
            outTransition: {
                method : 'spring',
                period : 600,
                dampingRatio : .5,
                velocity : 0
            },
            overlap: true
        }
    }
}

// OTHER PHYSICS OPTIONS
// inTransition : {
//   method : 'spring',
//   period : 300,
//   dampingRatio : .6,
//   velocity : 0
// },
// inTransition : {
//   method : 'stiffspring',
//   period : 10,
//   dampingRatio : .6,
//   velocity : 0
// },