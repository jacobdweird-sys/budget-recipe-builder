export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-900 dark:text-slate-200">
      <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">
        Terms of Service
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using EZ Recipes (&ldquo;the App&rdquo;), you agree to comply with these Terms of Service. If you do not agree to these terms, please do not use the App.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on EZ Recipes for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for commercial purposes or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or proprietary notations</li>
            <li>Transfer the materials to another person or &ldquo;mirror&rdquo; the materials on any other server</li>
            <li>Attempt to gain unauthorized access to any portion of the App</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. User Content</h2>
          <p className="mb-4">
            You retain ownership of any content you create in the App (meal plans, notes, preferences). By using the App, you grant us permission to use your content for improving the App&apos;s functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Disclaimer of Warranties</h2>
          <p className="mb-4">
            The materials on EZ Recipes are provided on an &ldquo;as is&rdquo; basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Limitations of Liability</h2>
          <p className="mb-4">
            In no event shall EZ Recipes or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on EZ Recipes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Accuracy of Materials</h2>
          <p className="mb-4">
            The materials appearing on EZ Recipes could include technical, typographical, or photographic errors. EZ Recipes does not warrant that any of the materials on the App are accurate, complete, or current. We may make changes to the materials contained on the App at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Links</h2>
          <p className="mb-4">
            EZ Recipes has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by EZ Recipes of the site. Use of any such linked website is at the user&apos;s own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">9. Modifications</h2>
          <p className="mb-4">
            EZ Recipes may revise these terms of service for the App at any time without notice. By using the App, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
          <p className="mb-4">
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the App operates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
          <p className="mb-4">
            We reserve the right to terminate or suspend your account and access to the App at any time, for any reason, without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">12. Contact</h2>
          <p className="mb-4">
            If you have questions about these Terms of Service, please reach out to us through the App or via LinkedIn.
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
