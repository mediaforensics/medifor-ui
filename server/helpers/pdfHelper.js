const pdfPrinter = require("pdfmake");
const isempty = require("lodash.isempty");
const { applicationOutputPath, thumbnailPath } = require("./directories");

function getStyles() {
  const styles = {};

  styles.header = {
    bold: true,
    fillColor: "#dddddd",
    margin: [6, 3, 0, 0]
  };

  styles.summaryBase = { margin: [0, 4, 0, 2] };
  styles.summaryField = { ...styles.summaryBase, color: "#666666" };
  styles.summaryValue = { ...styles.summaryBase };

  styles.analyticBase = { margin: [0, 6, 0, 6] };
  styles.analyticScore = {
    ...styles.analyticBase,
    fontSize: 11,
    alignment: "center"
  };
  styles.analyticName = {
    ...styles.analyticBase,
    margin: [0, 6, 0, 3],
    bold: true
  };
  styles.analyticNameFacets = { margin: [0, 6, 0, 3] };

  styles.analyticDescription = {
    ...styles.analyticBase,
    margin: [0, 3, 0, 6],
    italics: true
  };
  styles.facetsList = {
    ...styles.analyticBase,
    margin: [0, 3, 0, 6],
    fontSize: 8
  };

  styles.explanation = { ...styles.facetsList };
  styles.time = { ...styles.explanation, margin: [0, 3, 0, 3] };

  return styles;
}

function summary(image, score, fuserName, probe, file) {
  return [
    {
      layout: {
        defaultBorder: false
      },
      table: {
        widths: [120, "*"],

        body: [
          // Row 1 - image and heading
          [
            {
              rowSpan: 2,
              fit: [120, 120],
              image
            },
            { style: "header", text: "Media Summary" }
          ],
          // Row 2 - probe details
          [
            "", // This cell is occupied by the image (rowspan=2)
            {
              layout: {
                defaultBorder: false
              },
              table: {
                body: [
                  [
                    {
                      style: "summaryField",
                      text: `${fuserName}\n`
                    },
                    { style: "summaryValue", text: `${score}\n` }
                  ],
                  [
                    { style: "summaryField", text: "MD5 Hash\n" },
                    { style: "summaryValue", text: probe }
                  ],
                  [
                    { style: "summaryField", text: "File Name\n" },
                    { style: "summaryValue", text: file.name }
                  ],
                  [
                    { style: "summaryField", text: "File Size\n" },
                    { style: "summaryValue", text: file.size }
                  ],
                  [
                    { style: "summaryField", text: "Upload Date\n" },
                    { style: "summaryValue", text: file.date }
                  ]
                ]
              }
            }
          ]
        ]
      }
    }
  ];
}

function formatFacets(facets) {
  var sorted = [];
  for (var key in facets) {
    if (Object.prototype.hasOwnProperty.call(facets, key))
      sorted.push([key, facets[key]]);
  }
  sorted = sorted.sort((a, b) => {
    const f1 = a[1];
    const f2 = b[1];
    if (f1 >= f2) return -1;
    if (f2 > f1) return 1;
  });

  //Build array containing elements of [FusionName, Score]
  //with only scores greater than .01
  const finalSorted = sorted
    .filter(f => f[1] > 0.01)
    .map(f => [f[0], `${Math.round(f[1] * 100)}%`]);

  // Return a string ----- 'Reformat: 50% | Splicing: 65%'
  return finalSorted.map((facetInfo, index) => {
    const char = index == finalSorted.length - 1 ? "" : "|";
    return `${facetInfo[0]}: ${facetInfo[1]} ${char} `;
  });
}

function pdfAnalytics(analyticList) {
  analyticList.sort((a, b) => (a.friendlyName > b.friendlyName ? 1 : -1));

  const rowsWithScores = analyticList
    .filter(analytic => analytic.stage !== 1 && analytic.integrityScore !== -1)
    .map(buildRow);

  const rowsWithoutScores = analyticList
    .filter(analytic => analytic.stage !== 1 && analytic.integrityScore === -1)
    .map(buildRow);

  const rowsForUnrunAnalytics = analyticList
    .filter(analytic => analytic.stage === 1)
    .map(buildRow);

  const analyticTable = {
    layout: {
      defaultBorder: false,
      hLineColor: function(i, node) {
        return "#ccc";
      }
    },
    margin: [0, 10, 0, 10],
    table: {
      headerRows: 0,
      widths: [30, "*", 60],
      body: [
        // Row 1
        [
          {
            colSpan: 3,
            style: "header",
            alignment: "center",
            border: [false, true, false, false],
            text: "Complete"
          },
          { text: "" },
          { text: "" }
        ],
        // More Rows
        ...rowsWithScores,
        [
          {
            colSpan: 3,
            style: "header",
            alignment: "center",
            border: [false, true, false, true],
            text: "No Score Computed"
          },
          { text: "" },
          { text: "" }
        ],
        ...rowsWithoutScores,
        [
          {
            colSpan: 3,
            style: "header",
            alignment: "center",
            border: [false, true, false, true],
            text: "Analytics Not Run"
          },
          { text: "" },
          { text: "" }
        ],
        ...rowsForUnrunAnalytics
      ]
    }
  };
  return analyticTable;
}

function buildRow(analytic) {
  const row = [];
  const border = [false, true, false, true];
  const timeString = `Analyzed in ${analytic.time}`;

  // Three cells to a row;
  let firstCell = { border };
  let secondCell = { border };
  const maskOptions = { border };

  const regex = /\/medifor\/output/gi;
  let textStack = !isempty(analytic.facets)
    ? [
        {
          text: [
            { text: analytic.friendlyName, style: "analyticName" },
            {
              text: ` - ${formatFacets(analytic.facets).join("")}`,
              style: "facetsList"
            }
          ],
          style: "analyticNameFacets"
        },
        { text: analytic.description, style: "analyticDescription" }
      ]
    : [
        { text: analytic.friendlyName, style: "analyticName" },
        { text: analytic.description, style: "analyticDescription" }
      ];

  /* If analytic has valid explanation add it to the output */
  if (analytic.explanation.length > 0) {
    textStack.push({ text: analytic.explanation, style: "explanation" });
  }

  /* If analytic is completed add the completion time to output */
  if (analytic.stage == 3 && analytic.status == 1) {
    textStack.push({ text: timeString, style: "time" });
  }

  const score =
    analytic.integrityScore == -1
      ? null
      : Math.floor((1 - analytic.integrityScore) * 100) + "%";

  if (!!analytic.maskImagePath) {
    maskOptions.fit = [60, 60];
    maskOptions.image = analytic.maskImagePath.replace(
      regex,
      applicationOutputPath
    );
  } else {
    maskOptions.text = "";
  }

  const hasScore = !!score;
  // Score cell
  if (hasScore) {
    firstCell.text = score;
    firstCell.style = "analyticScore";
    secondCell.stack = textStack;
  } else {
    firstCell.stack = textStack;
    firstCell.colSpan = 2;

    secondCell.text = "";
    secondCell.style = "analyticName";
  }

  row.push(firstCell, secondCell, maskOptions);

  return row;
}

exports.createPDF = (
  fuser,
  fusionList,
  analyticDataList,
  detectionList,
  res
) => {
  var fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique"
    }
  };

  //In some instances a video can be viewed where it will not have a fuser selected
  //We must check if fusion info is defined, if not then just return 'No Fuser Selected'
  const detection = detectionList.detections[0];
  const resources = detection.req_resources;
  const currentFusion =
    detection.fusion_info &&
    detection.fusion_info.find(f => f.fuser_id == fuser);
  const target = currentFusion
    ? currentFusion.fusion.img_manip || currentFusion.fusion.vid_manip
    : "-1";
  const optedIn = currentFusion
    ? target.opt_out !== 1 && target.opt_out !== 2
    : "-1";
  const integrityScore = currentFusion
    ? scoreOrFacets(detection, optedIn, target, fuser)
    : "";
  const fuserName = currentFusion
    ? fusionList.find(f => f.id == fuser).name
    : "No Fuser Selected";

  const today = new Date();
  const month = today.getUTCMonth() + 1;
  const date = `${today.getUTCFullYear()}-${month
    .toString()
    .padStart(2, "0")}-${today
    .getUTCDate()
    .toString()
    .padStart(2, "0")}`;

  const printer = new pdfPrinter(fonts);
  const probe = detection.meta["Hash:md5"];
  const file = {
    name: detection.meta["File:FileName"],
    size: detection.meta["File:FileSize"],
    date: detection.meta["File:UploadDate"].slice(0, 10)
  };

  /* Video thumbnail extension will always be .jpg */
  /* Have to get image extension from the meta data...otherwise some img extensions
   * would be .jpeg which is incorrect */
  let imgExt = detection.meta["File:FileTypeExtension"];
  const thumbnailUrl = resources[0].type.includes("video")
    ? `${thumbnailPath}/${detection.id}.jpg`
    : `${thumbnailPath}/${detection.id}.${imgExt}`;

  var docDefinition = {
    pageSize: "LETTER",
    info: {
      title: `Analytic_Report-${date}.pdf`
    },
    footer: footer,
    content: [
      ...summary(thumbnailUrl, integrityScore, fuserName, probe, file),
      pdfAnalytics(analyticDataList[0])
    ],

    // Styles
    defaultStyle: {
      font: "Helvetica",
      fontSize: 9,
      color: "#333"
    },
    styles: getStyles()
  };

  function footer(currentPage, pageCount) {
    return [
      {
        text: `Generated on ${date} by Medifor · ${currentPage}`,
        color: "grey",
        alignment: "center",
        fontSize: 8,
        font: "Helvetica"
      }
    ];
  }

  function scoreOrFacets(detection, optedIn, target, fuser) {
    const validScore = 0 <= target.score <= 1;
    if (fuser == "multi") {
      return formatFacets(target.facets).join("");
    } else {
      return detection.has_fused && optedIn && validScore
        ? Math.floor((1 - target.score) * 100) + "%"
          ? detection.has_fused && optedIn && !validScore
          : "Error Score out of Range"
        : "No Score Computed";
    }
  }

  var options = {};

  var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
  pdfDoc.pipe(res);
  pdfDoc.end();
};
