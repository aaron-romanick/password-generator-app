import type { IncludedCharOptions } from './scripts/types'
import zxcvbn from 'zxcvbn'
import './style.scss'

/**
 * CONSTANTS
 */
const NUMBERS = '0123456789'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const SYMBOLS = '^%*@$!#&_-.'
const MIN_MANDATORY_ALLOWED_CHARACTERS = 2
const RANGE_SLIDER_DEFAULT = 10

/**
 * DOM ELEMENTS
 */
const passwordEl = document.querySelector('.form__password') as HTMLInputElement
const btnCopyEl = document.querySelector('.button__copy') as HTMLButtonElement
const rangeSliderEl = document.querySelector('.form__range') as HTMLInputElement
const rangeDisplayEl = document.querySelector('.control__value') as HTMLSpanElement
const includedCharOptionEls = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
const strengthValueEl = document.querySelector('.strength__value') as HTMLElement
const strengthMeterEl = document.querySelector('.strength__meter') as HTMLElement
const btnGenerateEl = document.querySelector('.button__generate') as HTMLButtonElement
const notifyCopyEl = document.querySelector('.notification__copy') as HTMLElement

/**
 * Creates a duotoned range slider (left and right side of the 'thumb')
 * to deal with browsers that don't have support for that yet
 * 
 * https://stackoverflow.com/questions/18389224/how-to-style-html5-range-input-to-have-different-color-before-and-after-slider
 * @dargue3
 */
const setSliderRangeBg = () => {
  const progressColor = 'var(--dm-form-accent)'
  const trackColor = 'var(--dm-form-range-runner-track-bg)'

  const progressPercentage = (+rangeSliderEl.value - +rangeSliderEl.min) / (+rangeSliderEl.max - +rangeSliderEl.min) * 100
  rangeSliderEl.style.backgroundImage = `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${progressPercentage}%, ${trackColor} ${progressPercentage}%, ${trackColor} 100%)`
  setRangeDisplayText()
}

/**
 * Display the number of the range slider's current value
 */
const setRangeDisplayText = () => {
  rangeDisplayEl.innerText = rangeSliderEl.value
}

/**
 * Sets default value for password length range slider
 */
const setRangeSliderDefault = () => {
  rangeSliderEl.value = RANGE_SLIDER_DEFAULT.toString()
}

/**
 * Sets buttons on page to disabled if range slider value
 * is 0.
 * 
 * @param {number} rangeSliderValue - current value of the range slider
 */
const toggleButtonsActiveState = (rangeSliderValue: number) => {
  const btnEls = [btnCopyEl, btnGenerateEl]
  btnEls.forEach(btnEl => {
    rangeSliderValue > 0
      ? btnEl.removeAttribute('disabled')
      : btnEl.setAttribute('disabled', '')
  })
}

/**
 * Collect all the checked password character types
 */
const collectIncludedCharOptions = () => {
  const options: IncludedCharOptions = {
    uppercase: false,
    lowercase: false,
    numbers: false,
    symbols: false
  }
  includedCharOptionEls.forEach(el => {
    if(el.checked) {
      options[el.name as keyof IncludedCharOptions] = true
    }
  })
  return options
}

/**
 * Checks to see if any included character options have
 * been checked
 * 
 * @param {IncludedCharOptions} options - included character type settings
 */
const hasAnyIncludedCharOption = (options: IncludedCharOptions) => {
  return Object.values(options).some(option => option === true)
}

/**
 * Makes sure to include at least minimum amount of each 
 * included character type in password based on MIN_MANDATORY_ALLOWED_CHARACTERS value
 * 
 * @param {number} completePasswordLength - length of complete password
 * @param {IncludedCharOptions} options - included character type settings
 */
const forceAllIncludedChars = (completePasswordLength: number, options: IncludedCharOptions) => {
  const holdingArray = []
  for(let i = 0; i < MIN_MANDATORY_ALLOWED_CHARACTERS; i++) {
    let str = ''
    if(options.lowercase) { str += getRandCharFromString(LOWERCASE) }
    if(options.uppercase) { str += getRandCharFromString(UPPERCASE) }
    if(options.numbers) { str += getRandCharFromString(NUMBERS) }
    if(options.symbols) { str += getRandCharFromString(SYMBOLS) }
    holdingArray.push(cryptoShuffle(str))
  }
  const holdingStr = holdingArray.join('')
  return holdingStr.length > completePasswordLength
    ? holdingStr.substring(0, completePasswordLength) : holdingStr
}

/**
 * Generate new password based on character length range slider
 * and included character type values
 */
const generatePassword = () => {
  let validChars = ''
  const completePasswordLength: number = +rangeSliderEl.value
  const options = collectIncludedCharOptions()
  if(options.lowercase) { validChars += LOWERCASE }
  if(options.uppercase) { validChars += UPPERCASE }
  if(options.numbers) { validChars += NUMBERS }
  if(options.symbols) { validChars += SYMBOLS }

  let password = forceAllIncludedChars(completePasswordLength, options)
  while(hasAnyIncludedCharOption(options) && password.length < completePasswordLength) {
    password += getRandCharFromString(validChars)
  }
  password = cryptoShuffle(password)
  passwordEl.value = password
}

/**
 * Disables unchecking last included character type checkbox if it is the only one
 * currently checked
 */
const forceLastCheckbox = () =>  {
  const checkedOptions = Array.from(includedCharOptionEls).filter(el => el.checked)
  checkedOptions.forEach(el => {
    el.disabled = checkedOptions.length === 1 ? true : false
  })
}

/**
 * Get a random character from possible password character string
 * 
 * @param {string} str - string of possible password characters
 */
const getRandCharFromString = (str: string) => {
  const strLen = str.length
  const randInt = getRandomInt(0, strLen)
  return str.charAt(randInt)
}


/**
 * Copies password to clipboard, or if it cannot, writes error message to console
 * 
 * https://stackabuse.com/how-to-copy-to-clipboard-in-javascript-with-the-clipboard-api/
 * 
 * https://github.com/microsoft/TypeScript/issues/33923
 * @NCC1701M
 */
const copyPasswordToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(passwordEl.value)
    flashCopiedNotification()
  } catch(err) {
    console.log(err)
    console.error('Unable to write to clipboard.')
  }
}

/**
 * Shuffles string randomly
 * 
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @ashleedawg
 * 
 * @param {string} str - string to shuffle
 * @returns {string} Shuffled string
 */
const cryptoShuffle = (str: string) => {
  let randNum = cryptoRandom()
  const strArray = Array.from(str)
  const strArrayLen = strArray.length
  for(let i = strArrayLen - 1; i > 0; i--) {
    let j = Math.floor(randNum * (i + 1))
    ;[strArray[i], strArray[j]] = [strArray[j], strArray[i]]
  }
  return strArray.join('')
}

/**
 * Gets a random number between 0 and 1
 * (a more truly random number generator than Math.random)
 * 
 * @returns {number} - Random number between 0 and 1
 */
const cryptoRandom = () => {
  const randBuffer = new Uint32Array(1)
  crypto.getRandomValues(randBuffer)
  return randBuffer[0] / (0xffffffff + 1)
}

/**
 * Gets a random integer between minimum and maximum value
 * 
 * https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues
 * @sindilevich
 * 
 * @param {number} min - Minimum possible integer
 * @param {number} max - Maximum possible integer
 * @returns {number} - Randomly found integer
 */
const getRandomInt = (min: number, max: number) => {
  let randNum = cryptoRandom()
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)

  return Math.floor(randNum * (maxFloor - minCeil)) + minCeil
}

/**
 * Display password strength value
 * 
 * @param {string} strengthValue - Strength text
 * @param {string} strengthMeterDataAttr - Strength value in HTML data attribute
 */
const displayStrength = (strengthValue: string, strengthMeterDataAttr: string) => {
  strengthValueEl.innerText = strengthValue
  strengthMeterDataAttr
    ? strengthMeterEl.dataset.score = strengthMeterDataAttr
    : delete strengthMeterEl.dataset.score
}

/**
 * Uses zxcvbn to determine strength of generated password
 * and then displays it
 * 
 * https://www.npmjs.com/package/zxcvbn
 */
const setStrength = () => {
  const { score } = zxcvbn(passwordEl.value)
  let strengthValue = ''
  let strengthMeterDataAttr = ''
  if(passwordEl.value !== '') {
    if(score >= 4) {
      strengthValue = 'Strong'
      strengthMeterDataAttr = 'level-4'
    } else if(score === 3) {
      strengthValue = 'Medium'
      strengthMeterDataAttr = 'level-3'
    } else if(score === 2) {
      strengthValue = 'Weak'
      strengthMeterDataAttr = 'level-2'
    } else {
      strengthValue = 'Too Weak!'
      strengthMeterDataAttr = 'level-1'
    }
  }
  displayStrength(strengthValue, strengthMeterDataAttr)
}

/**
 * Display notification indicating password value has been copied
 * to clipboard, and then remove it after a short duration
 */
let notifyCopyTimeoutId: number | undefined = undefined
const flashCopiedNotification = () => {
  clearTimeout(notifyCopyTimeoutId)
  const duration = 4000

  // reset ARIA attributes to 'turn off' animation
  notifyCopyEl.setAttribute('aria-live', 'off')
  notifyCopyEl.setAttribute('aria-hidden', 'true')

  // trigger a reflow, resetting the animation
  notifyCopyEl.offsetWidth
  
  notifyCopyEl.setAttribute('aria-live', 'polite')
  notifyCopyEl.setAttribute('aria-hidden', 'false')

  notifyCopyTimeoutId = setTimeout(() => {
    notifyCopyEl.setAttribute('aria-live', 'off')
    notifyCopyEl.setAttribute('aria-hidden', 'true')
  }, duration)
}

/**
 * Sets various event listeners on the page
 */
const setListeners = () => {
  btnCopyEl.addEventListener('click', copyPasswordToClipboard)

  rangeSliderEl.addEventListener('input', () => {
    setSliderRangeBg()
    toggleButtonsActiveState(+rangeSliderEl.value)
    generatePassword()
    setStrength()
  })
  
  includedCharOptionEls.forEach(el => {
    el.addEventListener('change', () => {
      forceLastCheckbox()
      generatePassword()
      setStrength()
    })
  })
  
  btnGenerateEl.addEventListener('click', () => {
    generatePassword()
    setStrength()
  })
}

/**
 * Page run
 */
(() => {
  setRangeSliderDefault()
  setSliderRangeBg()
  toggleButtonsActiveState(+rangeSliderEl.value)
  setListeners()
  forceLastCheckbox()
  generatePassword()
  setStrength()
})()
