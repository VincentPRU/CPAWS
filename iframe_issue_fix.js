/*********************
 * 
 * 
 * 
 *   Third-Party Cookie Monitor
 *   Detects and notifies users when third-party cookie restrictions prevent form submission in embedded iframes.
 * 
 * 
 * 
 */
document.addEventListener('DOMContentLoaded', function() {
    
    const COOKIE_TEST_KEY = 'cookie_test';
    const alertContainer = document.getElementById('cookiesAlert');

    /* Add styling to every element */
    const style = document.createElement('style');
    style.textContent = `
            * { box-sizing: border-box; }
            #cookiesAlert {
                --danger-color: #d65757;
                --warning-color: #c87648;
                color: #333333;
                display: none;
                padding: 1rem;
                padding: clamp(0.75rem, 2.5%, 2rem);
                margin-bottom: 1rem;
                width: 100%;
                border-radius: 0.5rem;
                font-family: Tahoma, sans-serif;
            }
            #cookiesAlert .issue-desc { margin-top: 0px;}
            #cookiesAlert button { 
                cursor: pointer;
                font-size: 0.85rem;
            }
            #cookiesAlert header { font-size: 1rem; }
            #cookiesAlert section { font-size: 0.85rem; }
            #cookiesAlert ol{ margin-bottom: 0px; }
            #cookiesAlert ol li{ margin-top: 0.25rem;}
            #cookiesAlert.cookie-danger {
               background-color: rgb(255 231 231);
               border: 0.2rem solid var(--danger-color);
            }
            #cookiesAlert.cookie-danger a {
               color: var(--danger-color);
            }
            #cookiesAlert.cookie-warning {
               background-color: rgb(255 239 227);
               border: 0.2rem solid var(--warning-color);
            }
            #cookiesAlert.cookie-warning a {
               color: var(--warning-color);
            }
    `;
    document.head.appendChild(style);

    // Check if the alert container exists
    // If not, exit the function
    // This is useful for debugging purposes
    // and to avoid errors in case the element is not found
    //alertContainer = document.getElementById('cookiesAlert');
    
    if (!alertContainer) return;

    async function checkAccess() {

        const validation_status = {
            cookie: true,
            storage: true,
            no_error_detected: true,
            showStorageAccessButton: false,
        }

        try {                
            // 1. First - Test basic cookie access
            const canWriteCookies = await testCookieAccess();
            if (!canWriteCookies) {
                console.error('Cookies are blocked or not accessible.');
                validation_status.cookie = false;
                // 2. If cookies are blocked, immediately check storage access
                await handleStorageAccessRequest(alertContainer, validation_status);
            }

            // 2. Local storage verification
            const hasStorage = testStorageAccess();
            if (!hasStorage) {
                console.warn('Local storage is not accessible.');
                validation_status.storage = false;
            }

            // 3. Detection if cross-origin
            //const isCrossOrigin = await checkCrossOriginAccess();
            //if (isCrossOrigin)   

            const texts_EN = {
                warning_cookies_message: '<strong>Warning!</strong> Your browser is blocking third-party cookies, which may prevent this embedded form from submitting.',
                careful_cookies_message: '<strong>Warning!</strong> We’ve detected an issue that may affect your form submission. If you encounter errors, try one of these solutions:',
                enable_access_button: '<button style="display: inline-block;" id="enableAccessBtn" type="button" class="cookie-button">Click here</button> to enable third-party cookies.',
                what_to_do: 'Here\'s what you can do:',
                opt_1: '<strong><a id="originPageAnchor" href="#" target="_blank">Visit the original page</a></strong> to submit this form without restrictions, or <button type="button" onclick="navigator.clipboard.writeText(window.location.href)">copy this link</button> to open it manually.',
                opt_3: 'Open this window in a more compatible browser, such as <strong>Chrome</strong> or <strong>Edge</strong>.',
                modif_denied: "<strong>Permission to update settings was denied.</strong> Visit your browser settings to enable third-party cookies manually."
            }
            const texts_FR = {
                warning_cookies_message: '<strong>Attention !</strong> Votre navigateur bloque les cookies tiers, ce qui peut empêcher l\'envoi de ce formulaire intégré.',
                careful_cookies_message: '<strong>Attention !</strong> Nous avons détecté un problème qui pourrait affecter l\'envoi de votre formulaire. Si vous rencontrez des erreurs, essayez l\'une des solutions suivantes :',
                enable_access_button: '<button style="display: inline-block;" id="enableAccessBtn" type="button" class="cookie-button">Cliquez ici</button> pour autoriser les cookies tiers.',
                what_to_do: 'Voici ce que vous pouvez faire :',
                opt_1: '<strong><a id="originPageAnchor" href="#" target="_blank">Accéder à la page originale</a></strong> pour soumettre ce formulaire sans restrictions, ou <button type="button" onclick="navigator.clipboard.writeText(window.location.href)" class="text-button" aria-label="Copier le lien du formulaire">copier ce lien</button> pour l\'ouvrir manuellement.',
                opt_3: 'Ouvrir cette page dans un navigateur plus compatible, comme <strong>Chrome</strong> ou <strong>Edge</strong>.',
                modif_denied: "<strong>L'autorisation de modifier les paramètres a été refusée.</strong> Accédez aux paramètres de votre navigateur pour autoriser manuellement les cookies tiers."
            }

            // Assign the texts based on the language attribute of the alert container
            const texts = alertContainer?.getAttribute('lang') === 'fr'? texts_FR : texts_EN;

            // 3. Communicate the results if one of the tests failed
            if (!validation_status.cookie || !validation_status.storage || !validation_status.no_error_detected) {
                //3.1 Communicate the user if cookies are blocked
                alertContainer.classList.add(!validation_status.cookie ? 'cookie-danger' : 'cookie-warning'); //red
                alertContainer.style.display = 'block'; //Display it
                //3.2 Show the user a warning message
                const storageAccessButton = validation_status.showStorageAccessButton ? `<li id="enableAccessLi">${texts.enable_access_button}</li>` : '';

                alertContainer.innerHTML = `
                    <header>
                        <p class="issue-desc">${!validation_status.cookie ? texts.warning_cookies_message : texts.careful_cookies_message}</p>
                    </header>
                    <section>
                        <p><strong>${texts.what_to_do}</strong></p>
                        <ol>
                            ${storageAccessButton}
                            <li>${texts.opt_1}</li>
                            <li>${texts.opt_3}</li>
                        </ol>
                    </section>
                `

                // 3.3 Add the event listener to the button 
                if (validation_status.showStorageAccessButton)
                    document.getElementById("enableAccessBtn").addEventListener('click', async () => {
                        try {
                            await document.requestStorageAccess();
                            location.reload();
                        } catch (e) {
                            document.getElementById("enableAccessLi").innerHTML = modif_denied;
                        }
                    });

                // 3.4 Add the click event to the anchor tag
                const anchorTag = document.getElementById('originPageAnchor');
                if(anchorTag)
                    anchorTag.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.open(window.location.href, '_top');
                    });
            } else {
                console.log('Cross-domain validation passed. Cookies and storage are accessible.');
            }
        } catch (error) {
            console.error('Could not complete browser check:', error);
            validation_status.no_error_detected = false;
        }
    }

        // Cookie test function
    async function testCookieAccess() {
        try {
            document.cookie = `${COOKIE_TEST_KEY}=${Date.now()}; SameSite=None; Secure; path=/; max-age=60`;
            const canWriteCookies = document.cookie.includes(COOKIE_TEST_KEY);
            document.cookie = `${COOKIE_TEST_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            return canWriteCookies;
        } catch (e) {
            return false;
        }
    }

    // Fonctions utilitaires séparées pour plus de clarté
    function testStorageAccess() {
        try {
            const testKey = 'storage_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    async function checkCrossOriginAccess() {
        try {
            // Nouvelle méthode plus fiable pour Chrome/Edge
            if (window.self === window.top) return false;
            // Fallback pour anciens navigateurs
            const parentOrigin = window.parent.location.origin;
            return window.location.origin !== parentOrigin;
        } catch (e) {
            return true; // Si on ne peut accéder à parent, c'est cross-origin
        }
    }

    async function handleStorageAccessRequest(container, validation_status) {
        try {
            // Modern API (SAA)
            if ('hasStorageAccess' in document) {
                const hasAccess = await document.hasStorageAccess();
                if (!hasAccess && 'requestStorageAccess' in document) {
                    validation_status.showStorageAccessButton = true;
                    return;
                }
            }
        } catch (e) {
            //Save the even of an error 
            validation_status.no_error_detected = false;
            console.error('Error while checking storage access:', e);
        }
    }


    // Lancement de la vérification
    checkAccess();
});

