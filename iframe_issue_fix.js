/* Code used to help  */
document.addEventListener('DOMContentLoaded', function() {
    
    const COOKIE_TEST_KEY = 'cookie_test';
    const alertContainer = document.getElementById('cookiesAlert');

    /* Add styling to every element */
    const style = document.createElement('style');
    style.textContent = `
        #cookiesAlert {
        padding: max(1rem, 3vw);
        margin-bottom: 1rem;
        font-size: 0.85rem;
        width: 100%;
        }
        #cookiesAlert h3 { 
        font-size: 1.2rem;
        margin-top: 0;
        }
        #cookiesAlert button { 
        cursor: pointer;
        font-size: 0.85rem;
        }
        #cookiesAlert.cookie-danger {
        background-color: rgb(249, 203, 198);
        }
        #cookiesAlert.cookie-warning {
        background-color: rgb(228, 202, 162);
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
                validation_status.cookie = false;
                // 2. If cookies are blocked, immediately check storage access
                await handleStorageAccessRequest(alertContainer, validation_status);
            }

            // 2. Local storage verification
            const hasStorage = testStorageAccess();
            if (!hasStorage) {
                validation_status.storage = false;
            }

            // 3. Detection if cross-origin
            //const isCrossOrigin = await checkCrossOriginAccess();
            //if (isCrossOrigin)   
            
            const texts = {
                warning_title: 'Warning!',
                warning_cookies_message: 'Cookies are blocked in your browser settings, most likely preventing you from submiting this form.',
                careful_cookies_message: 'We detected an issue that might cause some problems while submiting this form. Keep an eye open for some error message while submiting and if something occurs, please consider one of the following solutions.',
            }

            // 3. Communicate the results if one of the tests failed
            if (!validation_status.cookie || !validation_status.storage || !validation_status.no_error_detected) {
                //3.1 Communicate the user if cookies are blocked
                alertContainer.classList.add(!validation_status.cookie ? 'cookie-danger' : 'cookie-warning'); //red
                //3.2 Show the user a warning message
                const storageAccessButton = validation_status.showStorageAccessButton ? `<li id="enableAccessLi"><button style="display: inline-block;" id="enableAccessBtn" class="cookie-button">Clique here</button> to enable the cross domain cookies.</li>` : '';

                alertContainer.innerHTML = `
                    <h3>${texts.warning_title}</h3>
                    <p>${!validation_status.cookie ? texts.warning_cookies_message : texts.careful_cookies_message}</p>
                    <h4>What you can do:</h4>
                    <ul>
                        <li><strong><a id="originPageAnchor" href="#">Visit the origin page</a></strong> of this form to submit it without restriction</li>
                        ${storageAccessButton}
                        <li>Open this window on a more compatible browser, such as Chrome or Edge.</li>
                        <li>If nothing works, you can always <button onclick="navigator.clipboard.writeText(window.location.href)">copy this link</button> and open it manually.</li>
                    </ul>
                `
                // 3.3 Add the event listener to the button 
                if (validation_status.showStorageAccessButton)
                    document.getElementById("enableAccessBtn").addEventListener('click', async () => {
                        try {
                            await document.requestStorageAccess();
                            location.reload();
                        } catch (e) {
                            document.getElementById("enableAccessLi").innerHTML = `
                                <strong>The automatic change of autorization has been denied.</strong>: Please check your browser settings to allow cross-domain cookies.
                            `;
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
                alertContainer.innerHTML = `
                    <h3>Cross-domain validation passed</h3>
                    <p>Cookies and storage are accessible.</p>
                `;
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

