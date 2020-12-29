<template>
  <div class="supplemental-container">
    <Navbar />
    <aside>
      <div class="panel">
        <p
          class="panel-heading is-size-7 has-text-grey-dark has-text-weight-semibold"
        >
          Info
        </p>
        <SupplementalMetaCard>
          <template v-slot:title>
            <span>{{ headerData.name }}</span>
          </template>
          <template v-slot:description>
            <span>{{ headerData.description }}</span>
          </template>
        </SupplementalMetaCard>

        <SupplementalMetaCard>
          <template v-slot:title>
            Integrity Score
          </template>
          <template v-slot:description>
            <IntegrityScore :score="headerData.score" format="integrity" />
          </template>
        </SupplementalMetaCard>
      </div>

      <div class="panel">
        <p
          class="panel-heading is-size-7 has-text-grey-dark has-text-weight-semibold"
        >
          Supplemental Data
        </p>
        <SupplementalCard
          v-for="s in supplemental"
          :key="s.uri"
          :data="s"
          :current="getCurrentSupplemental"
          v-on:clickedSupplemental="setSupplemental"
        />
      </div>
    </aside>

    <section>
      <SupplementalProbeViewer
        :analytic="analytic"
        :probe="probe"
        :currentSupplemental="getCurrentSupplemental"
      />
    </section>
  </div>
</template>

<script>
import IntegrityScore from "../common/IntegrityScore";
import Navbar from "../Navbar";
import SupplementalCard from "./SupplementalCard";
import SupplementalMetaCard from "./SupplementalMetaCard";
import SupplementalProbeViewer from "./SupplementalProbeViewer";

export default {
  name: "SupplementalContainer",
  data: function() {
    return {
      currentSupplemental: ""
    };
  },
  props: {
    friendly: Object,
    probe: Object,
    analytic: Object
  },
  components: {
    IntegrityScore,
    Navbar,
    SupplementalCard,
    SupplementalMetaCard,
    SupplementalProbeViewer
  },
  methods: {
    setSupplemental(value) {
      this.currentSupplemental = value;
    }
  },
  computed: {
    analyticOptedOut: function() {
      const analytic = this.analytic.detection;
      if (this.isImage) {
        const optOut = analytic.img_manip.opt_out;
        return optOut == 1 || optOut == 2;
      } else if (this.isVideo) {
        return analytic.vid_manip.opt_out.includes(0);
      }
      console.error("Unsupported: No image or video detected in analytic data");
      return false;
    },
    isImage: function() {
      return this.analytic.detection.img_manip !== undefined;
    },
    isVideo: function() {
      return this.analytic.detection.vid_manip !== undefined;
    },
    name: function() {
      return this.friendly.name;
    },
    description: function() {
      return this.friendly.description;
    },
    score: function() {
      const target =
        this.analytic.detection.img_manip || this.analytic.detection.vid_manip;
      return this.analyticOptedOut ? -1 : target.score;
    },
    supplemental: function() {
      const target =
        this.analytic.detection.img_manip || this.analytic.detection.vid_manip;
      return target.supplement;
    },
    headerData: function() {
      return {
        name: this.name,
        description: this.description,
        score: this.score
      };
    },
    getCurrentSupplemental: function() {
      return this.currentSupplemental;
    }
  },
  created() {
    const target =
      this.analytic.detection.img_manip || this.analytic.detection.vid_manip;
    this.currentSupplemental = target.supplement[0].uri;
  }
};
</script>

<style>
.supplemental-container {
  background: hsl(210, 32%, 93%);
  height: 100vh;
  display: grid;

  grid-template-rows: auto 1fr;
  grid-template-columns: 300px 1fr;
}

nav {
  grid-column: 1 / -1;
}

aside {
  background: hsl(0, 0%, 100%);
  padding: 6px;
  overflow-y: auto;
}

section {
  overflow-y: auto;
}

.list {
  grid-area: list;
  background-color: #d3d3d3;
}
</style>
