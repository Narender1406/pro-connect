import "./JobTabs.css";

const tabs = ["all", "saved", "applied"];

export default function JobTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="job-tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          onClick={() => onChange(tab)}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
