console.log("AcademicMatch platform loaded successfully.");


// =========================
// REGISTRATION FORM
// =========================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const errorMessage =
            document.getElementById("registerError");


        // Clear previous error message
        errorMessage.textContent = "";


        // Check required fields
        if (!name || !email || !password || !confirmPassword) {

            errorMessage.textContent =
                "Please complete all required fields.";

            return;
        }


        // Check password length
        if (password.length < 8) {

            errorMessage.textContent =
                "Password must contain at least 8 characters.";

            return;
        }


        // Check password confirmation
        if (password !== confirmPassword) {

            errorMessage.textContent =
                "Passwords do not match.";

            return;
        }


        // Disable submit button while registering
        const submitButton =
            registerForm.querySelector("button[type='submit']");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Creating account...";
        }


        try {

            // Create account in Supabase Authentication
            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {
                        data: {
                            full_name: name
                        }
                    }

                });


            // Supabase returned an error
            if (error) {

                console.error("Registration error:", error);

                errorMessage.textContent =
                    error.message;

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Create Account";
                }

                return;
            }


            // Save name/email temporarily for the next step
            sessionStorage.setItem(
                "registrationName",
                name
            );

            sessionStorage.setItem(
                "registrationEmail",
                email
            );


            console.log(
                "Registration successful:",
                data
            );


            /*
                If email confirmation is enabled,
                Supabase may create the user but
                not create an active session yet.
            */

            if (!data.session) {

                alert(
                    "Account created successfully! Please check your email and confirm your account before continuing."
                );

            } else {

                alert(
                    "Account created successfully!"
                );

            }


            // Continue to role selection
            window.location.href = "role.html";


        } catch (error) {

            console.error(
                "Unexpected registration error:",
                error
            );

            errorMessage.textContent =
                "Something went wrong. Please try again.";

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Create Account";
            }

        }

    });

}



// =========================
// LOGIN FORM
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const errorMessage =
            document.getElementById("loginError");

        const submitButton =
            loginForm.querySelector("button[type='submit']");


        // Clear previous error
        errorMessage.textContent = "";


        // Check fields
        if (!email || !password) {

            errorMessage.textContent =
                "Please enter your email and password.";

            return;
        }


        // Disable button
        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Logging in...";
        }


        try {

            console.log("Starting Supabase login...");


            // ONLY ONE Supabase login request
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


            console.log(
                "Login response:",
                data,
                error
            );


            // Supabase error
            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                errorMessage.textContent =
                    error.message;

                return;
            }


            // Make sure user exists
            if (!data || !data.user) {

                errorMessage.textContent =
                    "Login failed. Please try again.";

                return;
            }


            console.log(
                "Login successful:",
                data.user.id
            );


            // Save user ID
            sessionStorage.setItem(
                "userId",
                data.user.id
            );


            // Go to role selection
            window.location.href =
                "role.html";

        }


        catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );

            errorMessage.textContent =
                error.message ||
                "Unable to login. Please try again.";

        }


        finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Login";
            }

        }

    });

}
// =========================
// ROLE SELECTION
// =========================

const roleCards =
    document.querySelectorAll(".role-card");


if (roleCards.length > 0) {

    roleCards.forEach(function (card) {

        card.addEventListener("click", async function () {

            const selectedRole =
                card.dataset.role;


            // Get the currently logged-in Supabase user
            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();


            // Make sure a user is actually logged in
            if (userError || !user) {

                alert(
                    "Your login session could not be found. Please log in again."
                );

                window.location.href =
                    "login.html";

                return;
            }


            console.log(
                "Logged-in user:",
                user.id
            );


            // Update the user's role in the profiles table
            const { error: profileError } =
                await supabaseClient
                    .from("profiles")
                    .update({
                        role: selectedRole,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", user.id);


            // Check if the database update failed
            if (profileError) {

    console.error(
        "Role update error:",
        profileError
    );

    alert(
        "Role update failed:\n\n" +
        profileError.message
    );

    return;
}


            // Save temporarily as well
            sessionStorage.setItem(
                "selectedRole",
                selectedRole
            );


            console.log(
                "Role saved successfully:",
                selectedRole
            );


            // Go to the appropriate dashboard
            if (selectedRole === "student") {

    window.location.href =
        "student-profile.html";

}


            if (selectedRole === "company") {

    window.location.href =
        "company-profile.html";

}

if (selectedRole === "academician") {

    window.location.href =
        "academician-profile.html";

}

        });

    });

}


// =========================
// STUDENT PROFILE FORM
// =========================

const studentProfileForm =
    document.getElementById("studentProfileForm");


if (studentProfileForm) {

    const profileError =
        document.getElementById("profileError");

    const submitButton =
        studentProfileForm.querySelector(
            "button[type='submit']"
        );


    // =========================================
    // LOAD EXISTING STUDENT PROFILE
    // =========================================

    async function loadStudentProfile() {

        // Get currently logged-in user
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        // Check login
        if (userError || !user) {

            profileError.textContent =
                "Your login session has expired. Please log in again.";

            return;
        }


        // Get existing student profile
        const {
            data: studentProfile,
            error: studentProfileError
        } = await supabaseClient
            .from("student_profiles")
            .select(
    "college, degree, branch, graduation_year, bio, location, skills"
)
            .eq("user_id", user.id)
            .maybeSingle();


        // Check for database error
        if (studentProfileError) {

            console.error(
                "Unable to load student profile:",
                studentProfileError
            );

            profileError.textContent =
                "Unable to load your profile. Please try again.";

            return;
        }


        // If an existing profile was found,
        // put its data into the form
        if (studentProfile) {

            document.getElementById("college").value =
                studentProfile.college || "";


            document.getElementById("degree").value =
                studentProfile.degree || "";


            document.getElementById("branch").value =
                studentProfile.branch || "";


            document.getElementById("graduationYear").value =
                studentProfile.graduation_year || "";


            document.getElementById("location").value =
                studentProfile.location || "";


            document.getElementById("bio").value =
                studentProfile.bio || "";


            // Change button text because
            // the profile already exists
            submitButton.textContent =
                "Save Changes";

        }

    }


    // Load profile as soon as the page opens
    loadStudentProfile();


    // =========================================
    // SAVE / UPDATE STUDENT PROFILE
    // =========================================

    studentProfileForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            profileError.textContent = "";


            // Get currently logged-in user
            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();


            // Check login
            if (userError || !user) {

                profileError.textContent =
                    "Your login session has expired. Please log in again.";

                return;
            }


            // Get form values
            const college =
                document.getElementById("college").value.trim();

            const degree =
                document.getElementById("degree").value.trim();

            const branch =
                document.getElementById("branch").value.trim();

            const graduationYear =
                document.getElementById("graduationYear").value;

            const location =
                document.getElementById("location").value.trim();

            const bio =
                document.getElementById("bio").value.trim();


            // Disable button while saving
            submitButton.disabled = true;

            submitButton.textContent =
                "Saving...";


            // Save/update the profile
            const { error: saveError } =
                await supabaseClient
                    .from("student_profiles")
                    .upsert({

                        user_id: user.id,

                        college: college,

                        degree: degree,

                        branch: branch,

                        graduation_year:
                            graduationYear
                                ? Number(graduationYear)
                                : null,

                        location: location,

bio: bio,

skills:
    document.getElementById("skills").value.trim(),

updated_at:
    new Date().toISOString()

                    });


            // Check database error
            if (saveError) {

                console.error(
                    "Student profile save error:",
                    saveError
                );

                profileError.textContent =
                    saveError.message;

                submitButton.disabled = false;

                submitButton.textContent =
                    "Save Profile & Continue";

                return;
            }


            // Success
            alert(
                "Student profile saved successfully!"
            );


            // Go back to dashboard
            window.location.href =
                "student-dashboard.html";

        }
    );

}

// =========================
// COMPANY PROFILE FORM
// =========================

const companyProfileForm =
    document.getElementById("companyProfileForm");


if (companyProfileForm) {

    const companyProfileError =
        document.getElementById("companyProfileError");

    const submitButton =
        companyProfileForm.querySelector(
            "button[type='submit']"
        );


    // =========================================
    // LOAD EXISTING COMPANY PROFILE
    // =========================================

    async function loadCompanyProfile() {

        // Get currently logged-in user
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        // Check login
        if (userError || !user) {

            companyProfileError.textContent =
                "Your login session has expired. Please log in again.";

            return;
        }


        // Get main profile to verify role
        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();


        // Check profile
        if (profileError) {

            console.error(
                "Unable to load user profile:",
                profileError
            );

            companyProfileError.textContent =
                "Unable to verify your account.";

            return;
        }


        // Make sure this is a company account
        if (profile.role !== "company") {

            alert(
                "This page is only available to company accounts."
            );

            window.location.href =
                "role.html";

            return;
        }


        // Get existing company profile
        const {
            data: companyProfile,
            error: companyProfileErrorData
        } = await supabaseClient
            .from("company_profiles")
            .select(
                "company_name, description, website, location, company_type, team_size"
            )
            .eq("user_id", user.id)
            .maybeSingle();


        // Check database error
        if (companyProfileErrorData) {

            console.error(
                "Unable to load company profile:",
                companyProfileErrorData
            );

            companyProfileError.textContent =
                "Unable to load your company profile.";

            return;
        }


        // If profile already exists,
        // fill the form automatically
        if (companyProfile) {

            document.getElementById(
                "companyName"
            ).value =
                companyProfile.company_name || "";


            document.getElementById(
                "companyType"
            ).value =
                companyProfile.company_type || "";


            document.getElementById(
                "website"
            ).value =
                companyProfile.website || "";


            document.getElementById(
                "companyLocation"
            ).value =
                companyProfile.location || "";


            document.getElementById(
                "teamSize"
            ).value =
                companyProfile.team_size || "";


            document.getElementById(
                "companyDescription"
            ).value =
                companyProfile.description || "";


            submitButton.textContent =
                "Save Changes";

        }

    }


    // Load profile when page opens
    loadCompanyProfile();


    // =========================================
    // SAVE / UPDATE COMPANY PROFILE
    // =========================================

    companyProfileForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            companyProfileError.textContent =
                "";


            // Get logged-in user
            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();


            // Check login
            if (userError || !user) {

                companyProfileError.textContent =
                    "Your login session has expired. Please log in again.";

                return;
            }


            // Get form values
            const companyName =
                document.getElementById(
                    "companyName"
                ).value.trim();


            const companyType =
                document.getElementById(
                    "companyType"
                ).value.trim();


            const website =
                document.getElementById(
                    "website"
                ).value.trim();


            const companyLocation =
                document.getElementById(
                    "companyLocation"
                ).value.trim();


            const teamSize =
                document.getElementById(
                    "teamSize"
                ).value.trim();


            const companyDescription =
                document.getElementById(
                    "companyDescription"
                ).value.trim();


            // Disable button while saving
            submitButton.disabled = true;

            submitButton.textContent =
                "Saving...";


            // Save / update company profile
            const { error: saveError } =
                await supabaseClient
                    .from("company_profiles")
                    .upsert({

                        user_id: user.id,

                        company_name:
                            companyName,

                        description:
                            companyDescription,

                        website:
                            website,

                        location:
                            companyLocation,

                        company_type:
                            companyType,

                        team_size:
                            teamSize,

                        updated_at:
                            new Date().toISOString()

                    });


            // Check save error
            if (saveError) {

                console.error(
                    "Company profile save error:",
                    saveError
                );

                companyProfileError.textContent =
                    saveError.message;

                submitButton.disabled = false;

                submitButton.textContent =
                    "Save Company Profile";

                return;
            }


            // Success
            alert(
                "Company profile saved successfully!"
            );


            // Go to company dashboard
            window.location.href =
                "company-dashboard.html";

        }
    );

}

// =========================
// STUDENT DASHBOARD
// =========================

const welcomeMessage =
    document.getElementById("welcomeMessage");


if (welcomeMessage) {

    async function loadStudentDashboard() {

        // Get the currently logged-in Supabase user
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        // =========================================
        // CHECK LOGIN
        // =========================================

        if (userError || !user) {

            console.error(
                "No authenticated user:",
                userError
            );

            alert(
                "Please log in to access your dashboard."
            );

            window.location.href =
                "login.html";

            return;
        }


        // =========================================
        // GET MAIN PROFILE
        // =========================================

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();


        // Check profile
        if (profileError) {

            console.error(
                "Unable to load profile:",
                profileError
            );

            welcomeMessage.textContent =
                "Welcome!";

            return;
        }


        // =========================================
        // CHECK ROLE
        // =========================================

        if (profile.role !== "student") {

            alert(
                "This dashboard is only available to student accounts."
            );

            window.location.href =
                "role.html";

            return;
        }


        // =========================================
        // DISPLAY NAME
        // =========================================

        const studentName =
            profile.full_name || "Student";


        welcomeMessage.textContent =
            "Welcome, " + studentName + "!";


        // =========================================
        // GET STUDENT PROFILE
        // =========================================

        const {
            data: studentProfile,
            error: studentProfileError
        } = await supabaseClient
            .from("student_profiles")
            .select(
                "college, degree, branch, graduation_year, location"
            )
            .eq("user_id", user.id)
            .single();


        // Check student profile
        if (studentProfileError) {

            console.error(
                "Unable to load student profile:",
                studentProfileError
            );

            return;
        }


        // =========================================
        // DISPLAY ACADEMIC INFORMATION
        // =========================================

        document.getElementById(
            "collegeDisplay"
        ).textContent =
            studentProfile.college || "Not provided";


        document.getElementById(
            "degreeDisplay"
        ).textContent =
            studentProfile.degree || "Not provided";


        document.getElementById(
            "branchDisplay"
        ).textContent =
            studentProfile.branch || "Not provided";


        document.getElementById(
            "graduationYearDisplay"
        ).textContent =
            studentProfile.graduation_year || "Not provided";


        document.getElementById(
            "locationDisplay"
        ).textContent =
            studentProfile.location || "Not provided";

    }


    loadStudentDashboard();

}



// =========================
// LOGOUT
// =========================

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging out...";


            const { error } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to log out. Please try again."
                );

                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Logout";

                return;
            }


            // Successfully logged out
            window.location.href =
                "login.html";

        }
    );

}

// =========================
// COMPANY DASHBOARD
// =========================

const companyWelcomeMessage =
    document.getElementById("companyWelcomeMessage");


if (companyWelcomeMessage) {

    async function loadCompanyDashboard() {

        // =========================================
        // GET LOGGED-IN USER
        // =========================================

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        // =========================================
        // CHECK LOGIN
        // =========================================

        if (userError || !user) {

            console.error(
                "No authenticated user:",
                userError
            );

            alert(
                "Please log in to access your dashboard."
            );

            window.location.href =
                "login.html";

            return;
        }


        // =========================================
        // GET MAIN PROFILE
        // =========================================

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();


        // Check profile
        if (profileError) {

            console.error(
                "Unable to load company profile:",
                profileError
            );

            companyWelcomeMessage.textContent =
                "Welcome!";

            return;
        }


        // =========================================
        // CHECK ROLE
        // =========================================

        if (profile.role !== "company") {

            alert(
                "This dashboard is only available to company accounts."
            );

            window.location.href =
                "role.html";

            return;
        }


        // =========================================
        // GET COMPANY PROFILE
        // =========================================

        const {
            data: companyProfile,
            error: companyProfileError
        } = await supabaseClient
            .from("company_profiles")
            .select(
                "company_name, description, website, location, company_type, team_size"
            )
            .eq("user_id", user.id)
            .single();


        // Check company profile
        if (companyProfileError) {

            console.error(
                "Unable to load company profile:",
                companyProfileError
            );

            alert(
                "Unable to load your company profile."
            );

            return;
        }


        // =========================================
        // DISPLAY COMPANY NAME
        // =========================================

        const companyName =
            companyProfile.company_name ||
            "Your Company";


        companyWelcomeMessage.textContent =
            "Welcome, " + companyName + "!";


        // =========================================
        // DISPLAY COMPANY INFORMATION
        // =========================================

        document.getElementById(
            "companyNameDisplay"
        ).textContent =
            companyProfile.company_name ||
            "Not provided";


        document.getElementById(
            "companyTypeDisplay"
        ).textContent =
            companyProfile.company_type ||
            "Not provided";


        document.getElementById(
            "companyWebsiteDisplay"
        ).textContent =
            companyProfile.website ||
            "Not provided";


        document.getElementById(
            "companyLocationDisplay"
        ).textContent =
            companyProfile.location ||
            "Not provided";


        document.getElementById(
            "companyTeamSizeDisplay"
        ).textContent =
            companyProfile.team_size ||
            "Not provided";


        document.getElementById(
            "companyDescriptionDisplay"
        ).textContent =
            companyProfile.description ||
            "Not provided";

    }


    // Load dashboard
    loadCompanyDashboard();

}


// =========================
// POST OPPORTUNITY
// =========================

const opportunityForm =
    document.getElementById("opportunityForm");


if (opportunityForm) {

    opportunityForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // =========================================
            // GET FORM VALUES
            // =========================================

            const title =
                document.getElementById(
                    "opportunityTitle"
                ).value.trim();


            const opportunityType =
                document.getElementById(
                    "opportunityType"
                ).value;


            const sector =
                document.getElementById(
                    "sector"
                ).value;


            const description =
                document.getElementById(
                    "opportunityDescription"
                ).value.trim();


            const requiredSkills =
                document.getElementById(
                    "requiredSkills"
                ).value.trim();


            const location =
                document.getElementById(
                    "opportunityLocation"
                ).value.trim();


            const workMode =
                document.getElementById(
                    "workMode"
                ).value;


            const stipendOrSalary =
                document.getElementById(
                    "stipendOrSalary"
                ).value.trim();


            const duration =
                document.getElementById(
                    "duration"
                ).value.trim();


            const applicationDeadline =
                document.getElementById(
                    "applicationDeadline"
                ).value;


            const errorMessage =
                document.getElementById(
                    "opportunityError"
                );


            errorMessage.textContent = "";


            // =========================================
            // CHECK REQUIRED FIELDS
            // =========================================

            if (
                !title ||
                !opportunityType ||
                !sector ||
                !description
            ) {

                errorMessage.textContent =
                    "Please complete all required fields.";

                return;
            }


            // =========================================
            // DISABLE BUTTON
            // =========================================

            const submitButton =
                opportunityForm.querySelector(
                    "button[type='submit']"
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "Posting opportunity...";
            }


            try {

                // =====================================
                // GET CURRENT USER
                // =====================================

                const {
                    data: { user },
                    error: userError
                } = await supabaseClient.auth.getUser();


                if (userError || !user) {

                    console.error(
                        "Authentication error:",
                        userError
                    );

                    errorMessage.textContent =
                        "You must be logged in to post an opportunity.";

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Post Opportunity";
                    }

                    return;
                }


                // =====================================
                // CHECK COMPANY ROLE
                // =====================================

                const {
                    data: profile,
                    error: profileError
                } = await supabaseClient
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();


                if (
                    profileError ||
                    !profile ||
                    profile.role !== "company"
                ) {

                    console.error(
                        "Role verification error:",
                        profileError
                    );

                    errorMessage.textContent =
                        "Only company accounts can post opportunities.";

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Post Opportunity";
                    }

                    return;
                }


                // =====================================
                // SAVE OPPORTUNITY
                // =====================================

                const {
                    data,
                    error
                } = await supabaseClient
                    .from("opportunities")
                    .insert({

                        company_id: user.id,

                        title: title,

                        opportunity_type:
                            opportunityType,

                        sector: sector,

                        description: description,

                        required_skills:
                            requiredSkills || null,

                        location:
                            location || null,

                        work_mode:
                            workMode || null,

                        stipend_or_salary:
                            stipendOrSalary || null,

                        duration:
                            duration || null,

                        application_deadline:
                            applicationDeadline || null,

                        status: "open"

                    })
                    .select()
                    .single();


                // =====================================
                // HANDLE DATABASE ERROR
                // =====================================

                if (error) {

                    console.error(
                        "Opportunity creation error:",
                        error
                    );

                    errorMessage.textContent =
                        error.message;

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Post Opportunity";
                    }

                    return;
                }


                // =====================================
                // SUCCESS
                // =====================================

                console.log(
                    "Opportunity created successfully:",
                    data
                );


                alert(
                    "Opportunity posted successfully!"
                );


                // Return to company dashboard

                window.location.href =
                    "company-dashboard.html";


            } catch (error) {

                console.error(
                    "Unexpected error:",
                    error
                );

                errorMessage.textContent =
                    "Something went wrong. Please try again.";


                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.textContent =
                        "Post Opportunity";
                }

            }

        }
    );

}


// =========================
// COMPANY OPPORTUNITY LIST
// =========================

const companyOpportunityList =
    document.getElementById(
        "companyOpportunityList"
    );


if (companyOpportunityList) {

    async function loadCompanyOpportunities() {

        // =========================================
        // GET CURRENT USER
        // =========================================

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        // =========================================
        // CHECK LOGIN
        // =========================================

        if (userError || !user) {

            console.error(
                "Unable to get logged-in user:",
                userError
            );

            companyOpportunityList.innerHTML = `
                <p style="
                    text-align: center;
                    color: #dc2626;
                ">
                    Please log in to view your opportunities.
                </p>
            `;

            return;
        }


        // =========================================
        // GET COMPANY OPPORTUNITIES
        // =========================================

        const {
            data: opportunities,
            error: opportunitiesError
        } = await supabaseClient
            .from("opportunities")
            .select(`
    id,
    title,
    opportunity_type,
    sector,
    description,
    required_skills,
    location,
    work_mode,
    stipend_or_salary,
    duration,
    application_deadline,
    status,
    created_at,
    applications(count)
`)
            .eq("company_id", user.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        // =========================================
        // DATABASE ERROR
        // =========================================

        if (opportunitiesError) {

            console.error(
                "Unable to load opportunities:",
                opportunitiesError
            );

            companyOpportunityList.innerHTML = `
                <p style="
                    text-align: center;
                    color: #dc2626;
                ">
                    Unable to load your opportunities.
                </p>
            `;

            return;
        }


        // =========================================
        // NO OPPORTUNITIES
        // =========================================

        if (
            !opportunities ||
            opportunities.length === 0
        ) {

            companyOpportunityList.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                ">

                    <p style="
                        color: #64748b;
                        margin-bottom: 15px;
                    ">
                        You haven't posted any opportunities yet.
                    </p>

                    <a
                        href="post-opportunity.html"
                        class="btn btn-primary"
                    >
                        Post Your First Opportunity
                    </a>

                </div>
            `;

            return;
        }


        // =========================================
        // DISPLAY OPPORTUNITIES
        // =========================================

        companyOpportunityList.innerHTML = "";


        opportunities.forEach(
            function (opportunity) {

                const opportunityCard =
                    document.createElement("div");


                opportunityCard.style.cssText = `
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 25px;
                    margin-bottom: 20px;
                    background: #ffffff;
                `;


                // =================================
                // CREATE SAFE DISPLAY VALUES
                // =================================

                const title =
                    opportunity.title ||
                    "Untitled Opportunity";


                const type =
                    opportunity.opportunity_type ||
                    "Not specified";


                const sector =
                    opportunity.sector ||
                    "Not specified";


                const location =
                    opportunity.location ||
                    "Not specified";


                const workMode =
                    opportunity.work_mode ||
                    "Not specified";


                const stipend =
                    opportunity.stipend_or_salary ||
                    "Not specified";


                const duration =
                    opportunity.duration ||
                    "Not specified";


                const status =
                    opportunity.status ||
                    "open";
                    const applicantCount =
    opportunity.applications?.[0]?.count || 0;


                const deadline =
                    opportunity.application_deadline ||
                    "Not specified";


                // =================================
                // CARD HTML
                // =================================

                opportunityCard.innerHTML = `

                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 15px;
                        margin-bottom: 15px;
                    ">

                        <div>

                            <h2 style="
                                margin-bottom: 6px;
                                font-size: 21px;
                            ">
                                ${title}
                            </h2>

                            <p style="
                                color: #64748b;
                                font-size: 14px;
                            ">
                                ${type} • ${sector}
                            </p>

                        </div>


                        <span style="
                            padding: 5px 10px;
                            border-radius: 20px;
                            background: #eff6ff;
                            color: #1d4ed8;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: capitalize;
                        ">
                            ${status}
                        </span>

                    </div>


                    <div style="
                        display: grid;
                        grid-template-columns:
                            repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 18px;
                    ">

                        <p>
                            <strong>Location:</strong>
                            ${location}
                        </p>

                        <p>
                            <strong>Work Mode:</strong>
                            ${workMode}
                        </p>

                        <p>
                            <strong>Stipend / Salary:</strong>
                            ${stipend}
                        </p>

                        <p>
                            <strong>Duration:</strong>
                            ${duration}
                        </p>

                        <p>
                            <strong>Application Deadline:</strong>
                            ${deadline}
                        </p>

                    </div>


                    <div style="
                        margin-bottom: 20px;
                    ">

                        <p style="
                            color: #64748b;
                            line-height: 1.6;
                        ">
                            ${opportunity.description || ""}
                        </p>

                    </div>


                                        ${
                        opportunity.required_skills
                        ? `
                            <p style="
                                color: #475569;
                                font-size: 14px;
                                margin-bottom: 15px;
                            ">
                                <strong>
                                    Required Skills:
                                </strong>

                                ${opportunity.required_skills}
                            </p>
                        `
                        : ""
                    }

                    <p style="
    color: #475569;
    font-size: 14px;
    margin-top: 10px;
">
    <strong>
        Applicants:
    </strong>

    ${applicantCount}
</p>


                    <div style="
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-top: 20px;
                    ">

                        <a
                            href="view-applicants.html?id=${opportunity.id}"
                            class="btn btn-primary"
                        >
                            View Applicants
                        </a>

                    </div>

                `;


                companyOpportunityList.appendChild(
                    opportunityCard
                );

            }
        );

    }


    // Load opportunities
    loadCompanyOpportunities();

}



// =========================
// STUDENT OPPORTUNITIES
// =========================

const studentOpportunityList =
    document.getElementById("studentOpportunityList");

const opportunityCount =
    document.getElementById("opportunityCount");


if (studentOpportunityList) {

    let allStudentOpportunities = [];

let currentStudentSkills = [];


    // =========================================
    // LOAD OPPORTUNITIES
    // =========================================

    async function loadStudentOpportunities() {
        // =========================================
// GET STUDENT SKILLS
// =========================================

const {
    data: { user },
    error: userError
} = await supabaseClient.auth.getUser();

let studentSkills = [];

if (!userError && user) {

    const {
        data: studentProfile,
        error: studentProfileError
    } = await supabaseClient
        .from("student_profiles")
        .select("skills")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!studentProfileError && studentProfile) {

        studentSkills =
            (studentProfile.skills || "")
                .split(",")
                .map(function (skill) {
                    return skill.trim().toLowerCase();
                })
                .filter(Boolean);

    }

}

currentStudentSkills =
    studentSkills;

        studentOpportunityList.innerHTML = `
            <p style="
                text-align: center;
                color: #64748b;
                padding: 40px;
            ">
                Loading opportunities...
            </p>
        `;


        const {
            data,
            error
        } = await supabaseClient
            .from("opportunities")
            .select(`
    id,
    title,
    opportunity_type,
    sector,
    description,
    required_skills,
    location,
    work_mode,
    stipend_or_salary,
    duration,
    application_deadline,
    status,
    created_at
`)
            .eq("status", "open")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Error loading opportunities:",
                error
            );

            studentOpportunityList.innerHTML = `
                <p style="
                    text-align: center;
                    color: #dc2626;
                    padding: 40px;
                ">
                    Unable to load opportunities.
                </p>
            `;

            if (opportunityCount) {
                opportunityCount.textContent = "0 opportunities";
            }

            return;
        }


        allStudentOpportunities = data || [];


// =========================================
// GET COMPANY NAMES
// =========================================




displayStudentOpportunities(
    allStudentOpportunities,
    studentSkills
);

    }



    // =========================================
    // DISPLAY OPPORTUNITIES
    // =========================================

   function displayStudentOpportunities(
    opportunities,
    studentSkills = []
) {

        studentOpportunityList.innerHTML = "";


        if (opportunityCount) {

            opportunityCount.textContent =
                opportunities.length +
                (
                    opportunities.length === 1
                        ? " opportunity"
                        : " opportunities"
                );

        }


        if (opportunities.length === 0) {

            studentOpportunityList.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 50px 20px;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    background: white;
                ">

                    <h3>
                        No opportunities found
                    </h3>

                    <p style="
                        color: #64748b;
                        margin-top: 8px;
                    ">
                        There are currently no open
                        opportunities matching your search.
                    </p>

                </div>
            `;

            return;
        }



        opportunities.forEach(
            function (opportunity) {

                const card =
                    document.createElement("div");


                card.style.cssText = `
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 25px;
                    margin-bottom: 20px;
                `;


                const title =
                    opportunity.title ||
                    "Untitled Opportunity";


                const type =
                    opportunity.opportunity_type ||
                    "Not specified";


                const sector =
                    opportunity.sector ||
                    "Not specified";


                const location =
                    opportunity.location ||
                    "Not specified";


                const workMode =
                    opportunity.work_mode ||
                    "Not specified";


                const stipend =
                    opportunity.stipend_or_salary ||
                    "Not specified";


                const duration =
                    opportunity.duration ||
                    "Not specified";


                const deadline =
                    opportunity.application_deadline ||
                    "Not specified";


                const description =
                    opportunity.description ||
                    "No description provided.";


                const skills =
                    opportunity.required_skills ||
                    "Not specified";
                    // =========================================
// CALCULATE SKILL MATCH
// =========================================

let matchPercentage = 0;

if (
    opportunity.required_skills &&
    studentSkills.length > 0
) {

    const requiredSkills =
        opportunity.required_skills
            .split(",")
            .map(function (skill) {
                return skill.trim().toLowerCase();
            })
            .filter(Boolean);


    if (requiredSkills.length > 0) {

        let matchedSkills = 0;


        requiredSkills.forEach(
            function (requiredSkill) {

                const matched =
                    studentSkills.some(
                        function (studentSkill) {

                            return (
                                studentSkill.includes(
                                    requiredSkill
                                ) ||
                                requiredSkill.includes(
                                    studentSkill
                                )
                            );

                        }
                    );


                if (matched) {
                    matchedSkills++;
                }

            }
        );


        matchPercentage =
            Math.round(
                (
                    matchedSkills /
                    requiredSkills.length
                ) * 100
            );

    }

}



                card.innerHTML = `

                    <div style="
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        margin-bottom: 15px;
                    ">

                        <div>

                            <h2 style="
                                margin-bottom: 5px;
                                font-size: 22px;
                            ">
                                ${title}
                            </h2>

                           <p style="
    color: #64748b;
    font-size: 14px;
">
    <strong>
        ${opportunity.company_name || "Company"}
    </strong>
    •
    ${type} • ${sector}
</p>

                        </div>


                        <div style="
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
">

    <span style="
        background: #dcfce7;
        color: #166534;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
    ">
        Open
    </span>


    ${
        matchPercentage > 0
            ? `
                <span style="
                    background: #eff6ff;
                    color: #1d4ed8;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                ">
                    ${matchPercentage}% Match
                </span>
            `
            : `
                <span style="
                    background: #f8fafc;
                    color: #64748b;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                ">
                    No skill match yet
                </span>
            `
    }

</div>

                    </div>



                    <div style="
                        display: grid;
                        grid-template-columns:
                            repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 18px;
                    ">

                        <p>
                            <strong>Location:</strong>
                            ${location}
                        </p>

                        <p>
                            <strong>Work Mode:</strong>
                            ${workMode}
                        </p>

                        <p>
                            <strong>Stipend / Salary:</strong>
                            ${stipend}
                        </p>

                        <p>
                            <strong>Duration:</strong>
                            ${duration}
                        </p>

                        <p>
                            <strong>Deadline:</strong>
                            ${deadline}
                        </p>

                    </div>



                    <p style="
                        color: #64748b;
                        line-height: 1.6;
                        margin-bottom: 15px;
                    ">
                        ${description}
                    </p>



                    <p style="
                        color: #475569;
                        font-size: 14px;
                        margin-bottom: 20px;
                    ">

                        <strong>
                            Required Skills:
                        </strong>

                        ${skills}

                    </p>



                    <a
    href="opportunity-details.html?id=${opportunity.id}"
    class="btn btn-primary"
>
    View Details
</a>

                `;


                studentOpportunityList.appendChild(card);

            }
        );

    }



    // =========================================
    // SEARCH + FILTER
    // =========================================

   function filterStudentOpportunities() {

    const searchInput =
        document.getElementById(
            "opportunitySearch"
        );


    const typeFilter =
        document.getElementById(
            "opportunityTypeFilter"
        );


    const sectorFilter =
        document.getElementById(
            "opportunitySectorFilter"
        );


    const workModeFilter =
        document.getElementById(
            "opportunityWorkModeFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const type =
        typeFilter
            ? typeFilter.value.toLowerCase()
            : "";


    const sector =
        sectorFilter
            ? sectorFilter.value.toLowerCase()
            : "";


    const workMode =
        workModeFilter
            ? workModeFilter.value.toLowerCase()
            : "";


    const filtered =
        allStudentOpportunities.filter(
            function (opportunity) {

                const searchableText = (

                    (opportunity.title || "") +
                    " " +
                    (opportunity.description || "") +
                    " " +
                    (opportunity.required_skills || "") +
                    " " +
                    (opportunity.sector || "")

                ).toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(search);


                const matchesType =
                    !type ||
                    (
                        opportunity.opportunity_type ||
                        ""
                    ).toLowerCase() === type;


                const matchesSector =
                    !sector ||
                    (
                        opportunity.sector ||
                        ""
                    ).toLowerCase() === sector;


                const matchesWorkMode =
                    !workMode ||
                    (
                        opportunity.work_mode ||
                        ""
                    ).toLowerCase() === workMode;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesSector &&
                    matchesWorkMode
                );

            }
        );


    displayStudentOpportunities(
        filtered,
        currentStudentSkills
    );

}



    // =========================================
    // FILTER EVENTS
    // =========================================

    const searchInput =
        document.getElementById(
            "opportunitySearch"
        );


    const typeFilter =
        document.getElementById(
            "opportunityTypeFilter"
        );


    const sectorFilter =
        document.getElementById(
            "opportunitySectorFilter"
        );


    const workModeFilter =
        document.getElementById(
            "opportunityWorkModeFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterStudentOpportunities
        );

    }


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            filterStudentOpportunities
        );

    }


    if (sectorFilter) {

        sectorFilter.addEventListener(
            "change",
            filterStudentOpportunities
        );

    }


    if (workModeFilter) {

        workModeFilter.addEventListener(
            "change",
            filterStudentOpportunities
        );

    }


    // =========================================
    // START
    // =========================================

    loadStudentOpportunities();

}

// =========================
// ACADEMICIAN PROFILE FORM
// =========================

const academicianProfileForm =
    document.getElementById("academicianProfileForm");

if (academicianProfileForm) {

    const academicianProfileError =
        document.getElementById("academicianProfileError");

    const submitButton =
        academicianProfileForm.querySelector(
            "button[type='submit']"
        );


    // =========================================
    // LOAD EXISTING ACADEMICIAN PROFILE
    // =========================================

    async function loadAcademicianProfile() {

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError || !user) {

            academicianProfileError.textContent =
                "Your login session has expired. Please log in again.";

            return;
        }


        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();


        if (profileError) {

            console.error(
                "Unable to verify role:",
                profileError
            );

            academicianProfileError.textContent =
                "Unable to verify your account.";

            return;
        }


        if (profile.role !== "academician") {

            alert(
                "This page is only available to academician accounts."
            );

            window.location.href =
                "role.html";

            return;
        }


        const {
            data: academicianProfile,
            error: academicianProfileErrorData
        } = await supabaseClient
            .from("academician_profiles")
            .select(`
                institution,
                designation,
                department,
                specialization,
                experience,
                location,
                bio,
                research_interests
            `)
            .eq("user_id", user.id)
            .maybeSingle();


        if (academicianProfileErrorData) {

            console.error(
                "Unable to load academician profile:",
                academicianProfileErrorData
            );

            academicianProfileError.textContent =
                "Unable to load your profile.";

            return;
        }


        if (academicianProfile) {

            document.getElementById("institution").value =
                academicianProfile.institution || "";

            document.getElementById("designation").value =
                academicianProfile.designation || "";

            document.getElementById("department").value =
                academicianProfile.department || "";

            document.getElementById("specialization").value =
                academicianProfile.specialization || "";

            document.getElementById("experience").value =
                academicianProfile.experience ?? "";

            document.getElementById("academicianLocation").value =
                academicianProfile.location || "";

            document.getElementById("academicianBio").value =
                academicianProfile.bio || "";

            document.getElementById("researchInterests").value =
                academicianProfile.research_interests || "";

            submitButton.textContent =
                "Save Changes";
        }

    }


    loadAcademicianProfile();


    // =========================================
    // SAVE ACADEMICIAN PROFILE
    // =========================================

    academicianProfileForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            academicianProfileError.textContent = "";


            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();


            if (userError || !user) {

                academicianProfileError.textContent =
                    "Your login session has expired. Please log in again.";

                return;
            }


            const institution =
                document.getElementById("institution")
                    .value.trim();

            const designation =
                document.getElementById("designation")
                    .value.trim();

            const department =
                document.getElementById("department")
                    .value.trim();

            const specialization =
                document.getElementById("specialization")
                    .value.trim();

            const experienceValue =
                document.getElementById("experience")
                    .value;

            const academicianLocation =
                document.getElementById("academicianLocation")
                    .value.trim();

            const bio =
                document.getElementById("academicianBio")
                    .value.trim();

            const researchInterests =
                document.getElementById("researchInterests")
                    .value.trim();


            if (!institution || !designation || !department) {

                academicianProfileError.textContent =
                    "Please complete all required fields.";

                return;
            }


            submitButton.disabled = true;

            submitButton.textContent =
                "Saving...";


            const { error: saveError } =
                await supabaseClient
                    .from("academician_profiles")
                    .upsert({

                        user_id: user.id,

                        institution:
                            institution,

                        designation:
                            designation,

                        department:
                            department,

                        specialization:
                            specialization || null,

                        experience:
                            experienceValue
                                ? Number(experienceValue)
                                : null,

                        location:
                            academicianLocation || null,

                        bio:
                            bio || null,

                        research_interests:
                            researchInterests || null,

                        updated_at:
                            new Date().toISOString()

                    });


            if (saveError) {

                console.error(
                    "Academician profile save error:",
                    saveError
                );

                academicianProfileError.textContent =
                    saveError.message;

                submitButton.disabled = false;

                submitButton.textContent =
                    "Save Profile & Continue";

                return;
            }


            alert(
                "Academician profile saved successfully!"
            );


            window.location.href =
                "academician-dashboard.html";

        }
    );

}