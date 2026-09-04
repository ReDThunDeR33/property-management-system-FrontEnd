import Layout from "../Components/Layout";

export default function IssuesPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• ISSUE TRACKING</p>
          <h1 className="text-3xl font-semibold">Reported Issues</h1>
          <p className="text-gray-500 mt-2">Tenants report issues, issues are linked to property and can generate work order.</p>
        </div>
      </section>
    </Layout>
  );
}