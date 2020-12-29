<template>
  <div>
    <!-- wait for local data to populate from request before loading child component -->
    <SupplementalContainer
      v-if="this.probe.analytic_info"
      :friendly="friendlyData"
      :probe="probeData"
      :analytic="analyticData"
    />
  </div>
</template>

<script>
import SupplementalContainer from "./components/SupplementalPage/SupplementalContainer.vue";
import { mapGetters } from "vuex";
import { buildRequest } from "@/helpers/urlBuilder";
import * as axios from "axios";

export default {
  name: "Supplemental",
  data: function() {
    return {
      probe: {},
      analyticId: {},
      analyticFriendly: {}
    };
  },
  components: {
    SupplementalContainer
  },
  computed: {
    ...mapGetters(["baseUri"]),
    probeData: function() {
      return this.probe;
    },
    friendlyData: function() {
      return this.analyticFriendly;
    },
    analyticData: function() {
      const analyticList = this.probe.analytic_info;
      return analyticList.find(a => a.analytic_id == this.analyticId);
    }
  },
  methods: {
    getProbeInfo(hash) {
      const path = `/probes/${hash}`;
      const url = buildRequest(this.baseUri, path);
      const probe = axios.get(url);

      probe
        .then(response => {
          this.probe = response.data;
        })
        .catch(err => {
          console.log("Error Retrieving Data", err);
        });
    },
    getAnalyticFriendly() {
      const path = `/analytics`;
      const url = buildRequest(this.baseUri, path);
      const friendly = axios.get(url);

      friendly
        .then(response => {
          const mergedList = [
            ...response.data.imageAnalytics,
            ...response.data.videoAnalytics,
            ...response.data.fusers
          ];
          this.analyticFriendly = mergedList.find(a => a.id == this.analyticId);
        })
        .catch(err => {
          console.log("Error Retrieving Data", err);
        });
    }
  },
  /* Make request to server to get probe information and friendly analytic information
  .* keeping the 'state' of this component seperate from the global state
  */
  created() {
    this.analyticId = this.$route.query.analytic;
    this.getProbeInfo(this.$route.query.probe);
    this.getAnalyticFriendly();
  }
};
</script>

<style scoped></style>
