import Navbar from "../components/Navbar";
import TeamsPage from "../pages/TeamsPage";
import WaitlistPage from "../pages/WaitlistPage";
import HostCourtPage from "../pages/HostCourtPage";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { JSX } from "react";
import { useSelectedVenueStore } from "../store/selectedVenue";

interface VenueDetailsViewProps {
  previewLocation: string;
  onBackToMap: () => void;
}

type SubView = "menu" | "teams" | "waitlist" | "host";


// export default function VenueDetailsView({
//   previewLocation,
//   onBackToMap,
// }: VenueDetailsViewProps) {


export default function VenueDetailsView(): JSX.Element {
  const [activeSubView, setActiveSubView] = useState<SubView>("menu");
    const { venue_name, venueID } = useParams(); 
    // I don't need these variables anymore because it's in the venue store now. 

    // const setVenue  = useSelectedVenueStore((state) => state.setVenue)

    // useEffect(() => {
    // if (!venueID || !venue_name) return;
    // setVenue(venueID, venue_name);
    // }, []);

  const navigate = useNavigate();
    // make a snapshot but pass in the venueID.

  return (
    <div className="h-screen flex flex-col bg-[#fdf2d1]">
      <Navbar />
      <main
        className="flex-1 flex flex-col relative bg-cover bg-center overflow-y-auto"
        style={{
          backgroundImage: `linear-gradient(rgba(253, 242, 209, 0.7), rgba(253, 242, 209, 0.7)), url('/gym-bg.jpg')`,
        }}
      >
        {activeSubView === "menu" && (
          <div className="flex flex-col items-center pt-12">
            <button
              onClick={() => navigate("/map")}
              className="absolute top-4 left-4 text-sm font-bold text-gray-600 hover:underline"
            >
              ← Back to Map
            </button>

            <h1 className="text-4xl font-normal text-gray-800 mb-12">
              {venue_name}
            </h1>

            <div className="flex flex-col gap-6 w-full max-w-md px-6">
              <button
                onClick={() => setActiveSubView("teams")}
                className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]"
              >
                Teams
              </button>

              <button
                onClick={() => setActiveSubView("waitlist")}
                className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]"
              >
                Waitlist Queue
              </button>

              <button
                onClick={() => setActiveSubView("host")}
                className="w-full py-6 bg-[#f7e49a] border border-gray-400 rounded-xl text-xl font-medium shadow-sm hover:bg-[#f2db82]"
              >
                Host Court
              </button>
            </div>
          </div>
        )}

        {activeSubView === "teams" && (
          <TeamsPage onBack={() => setActiveSubView("menu")} />
        )}
        {activeSubView === "waitlist" && (
          <WaitlistPage onBack={() => setActiveSubView("menu")} />
        )}
        {activeSubView === "host" && (
          <HostCourtPage onBack={() => setActiveSubView("menu")} />
        )}
      </main>
    </div>
  );
}