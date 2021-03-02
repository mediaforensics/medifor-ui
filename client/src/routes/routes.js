import App from "@/App";
import Supplemental from "@/Supplemental";
import ProbeContainer from "@/components/ProbeViewer/ProbeContainer";
import UploadContainer from "@/components/Upload/UploadContainer";
import GalleryContainer from "@/components/Gallery/GalleryContainer";

const routes = [
  {
    path: "/supplemental",
    component: Supplemental,
    name: "supplemental"
  },
  {
    path: "/",
    component: App,
    name: "app",
    children: [
      {
        path: "/gallery",
        name: "gallery",
        components: {
          gallery: GalleryContainer
        }
      },
      /* ProbeContainer and GalleryContainer are sibling components but to render them simultaneously they must
       * be render through 'named-views' */
      {
        path: "/gallery/probe/:id",
        name: "probe",
        components: {
          probe: ProbeContainer,
          gallery: GalleryContainer
        }
      },
      {
        path: "/upload",
        name: "upload",
        components: {
          upload: UploadContainer
        }
      }
    ]
  }
];

export default routes;
