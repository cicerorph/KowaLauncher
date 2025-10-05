/**
 * Script for loginOffline.ejs
 */

// Validation Regex for username
const validOfflineUsername = /^[a-zA-Z0-9_]{3,16}$/

// Login Offline Elements
const loginOfflineCancelContainer = document.getElementById('loginOfflineCancelContainer')
const loginOfflineCancelButton = document.getElementById('loginOfflineCancelButton')
const loginOfflineUsernameError = document.getElementById('loginOfflineUsernameError')
const loginOfflineUsername = document.getElementById('loginOfflineUsername')
const loginOfflineButton = document.getElementById('loginOfflineButton')
const loginOfflineForm = document.getElementById('loginOfflineForm')

// Control variable
let lou = false

/**
 * Show a login error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showOfflineError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeOfflineError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that a username field is neither empty nor invalid.
 * 
 * @param {string} value The username value.
 */
function validateOfflineUsername(value){
    if(value){
        if(!validOfflineUsername.test(value)){
            showOfflineError(loginOfflineUsernameError, Lang.queryJS('loginOffline.error.invalidValue'))
            loginOfflineDisabled(true)
            lou = false
        } else {
            loginOfflineUsernameError.style.opacity = 0
            lou = true
            loginOfflineDisabled(false)
        }
    } else {
        lou = false
        showOfflineError(loginOfflineUsernameError, Lang.queryJS('loginOffline.error.requiredValue'))
        loginOfflineDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginOfflineUsername.addEventListener('focusout', (e) => {
    validateOfflineUsername(e.target.value)
    shakeOfflineError(loginOfflineUsernameError)
})

// Validate input for username field.
loginOfflineUsername.addEventListener('input', (e) => {
    validateOfflineUsername(e.target.value)
})

/**
 * Enable or disable the login button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginOfflineDisabled(v){
    if(loginOfflineButton.disabled !== v){
        loginOfflineButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginOfflineLoading(v){
    if(v){
        loginOfflineButton.setAttribute('loading', v)
        loginOfflineButton.innerHTML = loginOfflineButton.innerHTML.replace(Lang.queryJS('loginOffline.login'), Lang.queryJS('loginOffline.loggingIn'))
    } else {
        loginOfflineButton.removeAttribute('loading')
        loginOfflineButton.innerHTML = loginOfflineButton.innerHTML.replace(Lang.queryJS('loginOffline.loggingIn'), Lang.queryJS('loginOffline.login'))
    }
}

/**
 * Enable or disable login form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function formOfflineDisabled(v){
    loginOfflineDisabled(v)
    loginOfflineCancelButton.disabled = v
    loginOfflineUsername.disabled = v
}

let loginOfflineViewOnSuccess = VIEWS.landing
let loginOfflineViewOnCancel = VIEWS.loginOptions
let loginOfflineViewCancelHandler

function loginOfflineCancelEnabled(val){
    if(val){
        $(loginOfflineCancelContainer).show()
    } else {
        $(loginOfflineCancelContainer).hide()
    }
}

loginOfflineCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginOfflineViewOnCancel, 500, 500, () => {
        loginOfflineUsername.value = ''
        loginOfflineCancelEnabled(false)
        if(loginOfflineViewCancelHandler != null){
            loginOfflineViewCancelHandler()
            loginOfflineViewCancelHandler = null
        }
    })
}

// Disable default form behavior.
loginOfflineForm.onsubmit = () => { return false }

// Bind login button behavior.
loginOfflineButton.addEventListener('click', () => {
    // Disable form.
    formOfflineDisabled(true)

    // Show loading stuff.
    loginOfflineLoading(true)

    AuthManager.addOfflineAccount(loginOfflineUsername.value).then((value) => {
        updateSelectedAccount(value)
        loginOfflineButton.innerHTML = loginOfflineButton.innerHTML.replace(Lang.queryJS('loginOffline.loggingIn'), Lang.queryJS('loginOffline.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.loginOffline, loginOfflineViewOnSuccess, 500, 500, async () => {
                // Temporary workaround
                if(loginOfflineViewOnSuccess === VIEWS.settings){
                    await prepareSettings()
                }
                loginOfflineViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginOfflineCancelEnabled(false) // Reset this for good measure.
                loginOfflineViewCancelHandler = null // Reset this for good measure.
                loginOfflineUsername.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginOfflineLoading(false)
                loginOfflineButton.innerHTML = loginOfflineButton.innerHTML.replace(Lang.queryJS('loginOffline.success'), Lang.queryJS('loginOffline.login'))
                formOfflineDisabled(false)
            })
        }, 1000)
    }).catch((displayableError) => {
        loginOfflineLoading(false)

        let actualDisplayableError
        if(isDisplayableError(displayableError)) {
            actualDisplayableError = displayableError
        } else {
            actualDisplayableError = {
                title: Lang.queryJS('loginOffline.error.unknown'),
                desc: Lang.queryJS('loginOffline.error.unknownDesc')
            }
        }

        setOverlayContent(actualDisplayableError.title, actualDisplayableError.desc, Lang.queryJS('loginOffline.tryAgain'))
        setOverlayHandler(() => {
            formOfflineDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
    })

})
