document.addEventListener(
    "DOMContentLoaded",
    function () {


        /*
         * =========================================
         * GET ELEMENTS
         * =========================================
         */

        const screens =
            document.querySelectorAll(
                ".screen"
            );


        const navigationButtons =
            document.querySelectorAll(
                "[data-go]"
            );


        const screenCounter =
            document.getElementById(
                "screenCounter"
            );


        const exitButton =
            document.getElementById(
                "exitButton"
            );



        /*
         * =========================================
         * SCREEN ORDER
         * =========================================
         */

        const screenOrder = [
            "welcome",
            "ecosystem",
            "student",
            "company",
            "academia",
            "final"
        ];



        /*
         * =========================================
         * CURRENT SCREEN
         * =========================================
         */

        let currentScreen =
            "welcome";



        /*
         * =========================================
         * SHOW SCREEN
         * =========================================
         */

        function showScreen(
            screenName
        ) {


            /*
             * Check whether requested
             * screen actually exists.
             */

            const targetScreen =
                document.querySelector(
                    `[data-screen="${screenName}"]`
                );


            if (!targetScreen) {

                console.error(
                    "Tour screen not found:",
                    screenName
                );

                return;

            }



            /*
             * Remove active state
             * from every screen.
             */

            screens.forEach(
                function (screen) {

                    screen.classList.remove(
                        "active"
                    );

                }
            );



            /*
             * Activate requested screen.
             */

            targetScreen.classList.add(
                "active"
            );


            currentScreen =
                screenName;



            /*
             * Update counter.
             */

            const index =
                screenOrder.indexOf(
                    screenName
                );


            if (
                screenCounter &&
                index !== -1
            ) {

                screenCounter.textContent =
                    String(index + 1).padStart(
                        2,
                        "0"
                    ) +
                    " / " +
                    String(
                        screenOrder.length
                    ).padStart(
                        2,
                        "0"
                    );

            }


        }



        /*
         * =========================================
         * ALL BUTTON NAVIGATION
         * =========================================
         */

        navigationButtons.forEach(
            function (button) {


                button.addEventListener(
                    "click",
                    function () {


                        const destination =
                            button.getAttribute(
                                "data-go"
                            );


                        if (!destination) {
                            return;
                        }


                        showScreen(
                            destination
                        );


                    }
                );


            }
        );



        /*
         * =========================================
         * EXIT TOUR
         * =========================================
         */

        if (exitButton) {

            exitButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "index.html";

                }
            );

        }



        /*
         * =========================================
         * KEYBOARD NAVIGATION
         * =========================================
         */

        document.addEventListener(
            "keydown",
            function (event) {


                const currentIndex =
                    screenOrder.indexOf(
                        currentScreen
                    );



                /*
                 * RIGHT ARROW
                 */

                if (
                    event.key ===
                    "ArrowRight"
                ) {

                    if (
                        currentIndex <
                        screenOrder.length - 1
                    ) {

                        showScreen(
                            screenOrder[
                                currentIndex + 1
                            ]
                        );

                    }

                }



                /*
                 * LEFT ARROW
                 */

                if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    if (
                        currentIndex > 0
                    ) {

                        showScreen(
                            screenOrder[
                                currentIndex - 1
                            ]
                        );

                    }

                }


            }
        );



        /*
         * =========================================
         * START TOUR
         * =========================================
         */

        showScreen(
            "welcome"
        );


    }
);