import Layout from "../Components/Layout";

export default function SettingsPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• ACCOUNT SETTINGS</p>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-gray-500 mt-2">Manage your profile and notification preferences.</p>
        </div>
      </section>
    </Layout>
  );
}