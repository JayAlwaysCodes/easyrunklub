import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Easy Run Klub",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        Terms and Conditions
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            1. Membership
          </h2>
          <p className="mt-2">
            Membership of Easy Run Klub is open to
            individuals who register through our platform and accept these
            Terms and Conditions. Membership may be subject to an
            activation or membership fee as communicated at the time of
            registration.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            2. Assumption of Risk
          </h2>
          <p className="mt-2">
            Running and related physical activities carry inherent risks.
            By joining the Klub and participating in any run, event, or
            activity organised by or associated with the Klub, you confirm
            that you are physically fit to participate and do so at your
            own risk. The Klub, its organisers, and volunteers are not
            liable for any injury, illness, loss, or damage arising from
            your participation.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            3. Code of Conduct
          </h2>
          <p className="mt-2">
            Members are expected to treat other members, organisers, and
            members of the public with respect during all Klub activities.
            The Klub reserves the right to suspend or terminate membership
            for conduct that endangers others, violates local laws, or
            damages the reputation of the Klub.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            4. Events and Cancellations
          </h2>
          <p className="mt-2">
            Event dates, times, and locations may change due to weather,
            safety concerns, or circumstances beyond the Klub&apos;s
            control. The Klub will make reasonable efforts to notify
            members of any changes in advance.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            5. Payments and Wallet
          </h2>
          <p className="mt-2">
            Any payments made through the platform, including membership
            fees, event fees, or wallet top-ups, are processed through
            third-party payment providers. Refunds, where applicable, are
            handled on a case-by-case basis at the Klub&apos;s discretion.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            6. Data and Privacy
          </h2>
          <p className="mt-2">
            Personal information collected during registration is used to
            manage your membership, communicate about events, and improve
            the Klub&apos;s services. We do not sell your personal
            information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            7. Changes to These Terms
          </h2>
          <p className="mt-2">
            The Klub may update these Terms and Conditions from time to
            time. Continued membership after changes are published
            constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}