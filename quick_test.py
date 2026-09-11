from backend.app.ai.classify_ticket import classify_ticket

password_tests = [
    ("Can't log into my account",
     "I keep getting an invalid password error even though I'm sure my password is correct. Please help.",
     "Technical Operations"),

    ("Invalid password error",
     "I'm getting an invalid password error on login.",
     "Technical Operations"),

    ("Locked out of my account",
     "After three failed login attempts my account got locked. Can you unlock it?",
     "Technical Operations"),

    ("Forgot my password",
     "I clicked 'forgot password' but the reset email never arrived. Can you resend it?",
     "Technical Operations"),

    ("Password reset not working",
     "The password reset link you sent takes me to an error page instead of letting me set a new password.",
     "Technical Operations"),
]

correct = 0
for subject, body, expected in password_tests:
    result = classify_ticket(subject, body)
    pred = result["category"]["label"]
    conf = result["category"]["confidence"]
    match = "✓" if pred == expected else "✗"
    if pred == expected:
        correct += 1
    print(f"{match} [{subject[:35]:35s}] Expected: {expected:22s} Got: {pred:25s} ({conf})")

print(f"\nScore: {correct}/{len(password_tests)}")