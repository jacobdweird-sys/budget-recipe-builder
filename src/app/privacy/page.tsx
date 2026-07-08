export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-900 dark:text-slate-200">
      <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">
        Privacy Policy
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            When you use EZ Recipes, we collect:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Account information: email address (for authentication)</li>
            <li>Profile data: name, bio, dietary preferences, budget goals, location</li>
            <li>Usage data: recipes saved, meal plans created, ingredients added</li>
            <li>Technical data: browser type, IP address, pages visited (via analytics)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use your data to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide and improve the app functionality</li>
            <li>Generate personalized meal plans and recipe recommendations</li>
            <li>Maintain your account and meal planning history</li>
            <li>Improve user experience through analytics</li>
            <li>Send updates about features (if you opt-in)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Data Storage</h2>
          <p className="mb-4">
            Your data is stored securely in our database. We use standard security measures to protect your personal information from unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Third-Party APIs</h2>
          <p className="mb-4">
            EZ Recipes uses third-party APIs for recipe data and meal generation:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Google Gemini API - for recipe recommendations</li>
            <li>Spoonacular API - for ingredient and recipe data</li>
            <li>Edamam API - for nutritional information</li>
          </ul>
          <p className="mt-4">
            Please review their privacy policies as they may collect data independently.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. User Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Request corrections to your data</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
          <p className="mb-4">
            We use cookies for authentication and session management. You can control cookie settings in your browser.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy as the app evolves. We will notify users of significant changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this privacy policy or how we handle your data, please reach out to us on LinkedIn or through the app.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  );
}
