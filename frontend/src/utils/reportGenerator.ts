import { format } from "date-fns";

export interface ExplanationData {
  predictedClass: string;
  confidenceScore: number;
  allScores: Record<string, number>;
  imageMri: string;
  createdAt?: string;
  modelName?: string;
  modelVersion?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Menghasilkan teks deskripsi klinis yang dinamis berdasarkan skor probabilitas model.
 */
export function generateClinicalExplanation(data: ExplanationData) {
  const { predictedClass, confidenceScore, allScores } = data;
  const confidencePercent = parseFloat((confidenceScore * 100).toFixed(2)); // number for comparisons
  const confidenceLabel = confidencePercent.toFixed(2);                     // string for display
  const clsLower = predictedClass.toLowerCase().replace(/[^a-z]/g, "");

  // Urutkan kelas lainnya untuk differential diagnosis
  const sortedOthers = Object.entries(allScores)
    .filter(([name]) => name.toLowerCase().replace(/[^a-z]/g, "") !== clsLower)
    .map(([name, val]) => ({ name, val: parseFloat((val * 100).toFixed(2)), vLabel: (val * 100).toFixed(2) }))
    .sort((a, b) => b.val - a.val);


  const highestAlternative = sortedOthers[0];

  let diagnosticClarity = "";
  if (confidencePercent >= 90) {
    diagnosticClarity =
      "menunjukkan tingkat keyakinan prediksi yang tinggi berdasarkan pola visual yang dipelajari model.";
  } else if (confidencePercent >= 70) {
    diagnosticClarity =
      "menunjukkan tingkat keyakinan prediksi yang cukup baik, namun tetap memerlukan interpretasi klinis lebih lanjut.";
  } else {
    diagnosticClarity =
      "menunjukkan tingkat keyakinan prediksi yang relatif rendah sehingga hasil perlu diinterpretasikan secara hati-hati.";
  }

  let textHTML = `
    <div class="space-y-4 text-sm text-slate-700 leading-relaxed">
      <p>
        Berdasarkan analisis deep learning terhadap citra MRI kepala yang diunggah, sistem mengklasifikasikan kasus ini sebagai 
        <strong>${predictedClass}</strong> dengan tingkat kepercayaan <strong>${confidenceLabel}%</strong>. 
        Hasil ini ${diagnosticClarity}
      </p>
  `;

  if (clsLower === "glioma") {
    textHTML += `
      <p>
        <strong>Interpretasi Hasil:</strong> 
        Model mendeteksi pola visual yang memiliki kemiripan dengan karakteristik citra MRI pada kasus Glioma. 
        Temuan ini dapat berkaitan dengan adanya area abnormal pada jaringan otak yang menunjukkan perubahan intensitas sinyal dan struktur jaringan dibandingkan area sekitarnya.
      </p>

      <p>
        Glioma merupakan jenis tumor yang berasal dari sel glial pada otak dan dapat memiliki tingkat pertumbuhan yang bervariasi. 
        Pada beberapa kasus, Glioma dapat disertai perubahan jaringan di sekitar lesi seperti edema atau efek penekanan terhadap struktur otak di sekitarnya.
      </p>
    `;
  } else if (clsLower === "meningioma") {
    textHTML += `
      <p>
        <strong>Interpretasi Hasil:</strong> 
        Sistem mendeteksi pola citra yang memiliki kemiripan dengan karakteristik Meningioma. 
        Lesi jenis ini umumnya muncul sebagai massa yang tumbuh dari lapisan pelindung otak (meninges) dan sering memiliki batas yang relatif jelas pada citra MRI.
      </p>

      <p>
        Meningioma umumnya bersifat jinak dan memiliki pertumbuhan yang lambat, meskipun pada kondisi tertentu tetap dapat menyebabkan tekanan pada jaringan otak di sekitarnya tergantung ukuran dan lokasi tumor.
      </p>
    `;
  } else if (clsLower === "pituitary") {
    textHTML += `
      <p>
        <strong>Interpretasi Hasil:</strong> 
        Model mendeteksi pola yang memiliki kemiripan dengan tumor pituitari pada area kelenjar pituitari. 
        Area tersebut berada di dasar otak dan berperan penting dalam pengaturan hormon tubuh.
      </p>

      <p>
        Tumor pituitari dapat menyebabkan perubahan hormonal maupun gangguan visual apabila ukuran lesi membesar dan menekan struktur di sekitarnya. 
        Evaluasi klinis lanjutan diperlukan untuk memastikan kondisi secara menyeluruh.
      </p>
    `;
  } else {
    textHTML += `
      <p>
        <strong>Interpretasi Hasil:</strong> 
        Berdasarkan analisis model terhadap citra MRI yang diberikan, sistem tidak menemukan pola visual yang secara signifikan mengarah pada keberadaan tumor otak dalam kategori yang didukung model.
      </p>

      <p>
        Meskipun demikian, hasil ini tidak sepenuhnya menyingkirkan kemungkinan adanya kelainan lain di luar cakupan klasifikasi sistem. 
        Interpretasi akhir tetap memerlukan evaluasi tenaga medis profesional dan pemeriksaan penunjang apabila diperlukan.
      </p>
    `;
  }

  if (highestAlternative && highestAlternative.val > 10 && clsLower !== "notumor") {
    textHTML += `
      <p class="border-l-2 border-amber-500 pl-3 bg-amber-50/40 py-1">
        <strong>Analisis Tambahan:</strong> 
        Selain prediksi utama <strong>${predictedClass}</strong>, model juga memberikan probabilitas sebesar 
        <strong>${highestAlternative.vLabel}%</strong> terhadap kelas 
        <strong>${highestAlternative.name}</strong>. 
        Hal ini menunjukkan adanya kemiripan fitur visual tertentu antar kelas pada citra MRI yang dianalisis.
      </p>
    `;
  }

  textHTML += `</div>`;
  return textHTML;
}

export function getClinicalSymptoms(predictedClass: string): string[] {
  const cls = predictedClass.toLowerCase().replace(/[^a-z]/g, "");
  if (cls === "glioma") {
    return [
      "Sakit kepala yang berlangsung terus-menerus",
      "Mual atau muntah tanpa penyebab yang jelas",
      "Kejang, terutama pada pasien tanpa riwayat epilepsi",
      "Gangguan keseimbangan atau koordinasi tubuh",
      "Kelemahan pada salah satu sisi tubuh",
      "Gangguan bicara, penglihatan, atau konsentrasi"
    ];
  } else if (cls === "meningioma") {
    return [
      "Sakit kepala yang muncul secara bertahap",
      "Gangguan penglihatan atau pendengaran",
      "Gangguan keseimbangan",
      "Kelemahan atau mati rasa pada anggota tubuh tertentu",
      "Perubahan kemampuan kognitif atau konsentrasi",
      "Kejang pada beberapa kasus"
    ];
  } else if (cls === "pituitary") {
    return [
      "Gangguan penglihatan, terutama penglihatan perifer",
      "Sakit kepala di area dahi atau belakang mata",
      "Perubahan hormonal",
      "Perubahan berat badan tanpa sebab jelas",
      "Gangguan siklus menstruasi atau fungsi seksual",
      "Kelelahan atau perubahan suasana hati"
    ];
  } else {
    return [
      "Tidak ditemukan indikasi gejala spesifik yang berkaitan dengan tumor otak",
      "Keluhan ringan seperti sakit kepala dapat disebabkan faktor lain",
      "Tetap diperlukan evaluasi medis apabila gejala menetap",
      "Disarankan menjaga pola tidur dan kesehatan umum",
      "Lakukan pemeriksaan lanjutan jika muncul gejala neurologis baru"
    ];
  }
}

export function getClinicalNextSteps(predictedClass: string): string[] {
  const cls = predictedClass.toLowerCase().replace(/[^a-z]/g, "");
  if (cls === "glioma") {
    return [
      "Disarankan berkonsultasi dengan dokter spesialis saraf atau radiologi.",
      "Pemeriksaan MRI lanjutan dengan kontras dapat dipertimbangkan untuk evaluasi lebih detail.",
      "Hasil klasifikasi perlu dikorelasikan dengan kondisi klinis dan riwayat pasien.",
      "Pemeriksaan tambahan mungkin diperlukan sesuai rekomendasi tenaga medis."
    ];
  } else if (cls === "meningioma") {
    return [
      "Disarankan melakukan konsultasi dengan dokter spesialis saraf.",
      "Pemantauan berkala melalui MRI dapat dipertimbangkan sesuai kondisi pasien.",
      "Evaluasi ukuran dan lokasi lesi diperlukan untuk menentukan tindak lanjut.",
      "Interpretasi akhir tetap memerlukan pemeriksaan radiologi profesional."
    ];
  } else if (cls === "pituitary") {
    return [
      "Disarankan melakukan evaluasi lebih lanjut oleh dokter spesialis.",
      "Pemeriksaan hormon dan evaluasi penglihatan dapat dipertimbangkan.",
      "MRI lanjutan mungkin diperlukan untuk analisis area pituitari secara lebih detail.",
      "Hasil sistem perlu dikombinasikan dengan pemeriksaan klinis lainnya."
    ];
  } else {
    return [
      "Tidak ditemukan indikasi tumor pada klasifikasi sistem.",
      "Tetap disarankan berkonsultasi dengan tenaga medis apabila gejala berlanjut.",
      "Pemeriksaan lanjutan dapat dilakukan sesuai kebutuhan klinis.",
      "Jaga pola hidup sehat dan lakukan monitoring kondisi secara berkala."
    ];
  }
}

export function printMedicalReport(data: ExplanationData) {
  const {
    predictedClass,
    confidenceScore,
    allScores,
    imageMri,
    createdAt,
    modelName = "EfficientNet-B0",
    modelVersion = "v1.0",
    userName = "Clinical User",
    userEmail = "-",
  } = data;

  const dateStr = createdAt ? format(new Date(createdAt), "dd MMMM yyyy, HH:mm") : format(new Date(), "dd MMMM yyyy, HH:mm");
  const reportId = `REP-${Math.floor(100000 + Math.random() * 900000)}`;

  const sortedScores = Object.entries(allScores)
    .map(([name, val]) => ({ name, val: parseFloat((val * 100).toFixed(2)), vLabel: (val * 100).toFixed(2) }))
    .sort((a, b) => b.val - a.val);

  const clinicalDescriptionHTML = generateClinicalExplanation(data);


  const html = `
    <html>
      <head>
        <title>NeuroScan Clinical Report - ${reportId}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #334155;
            line-height: 1.5;
            padding: 40px;
            margin: 0;
            background: #fff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
          }
          .logo-area {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
          }
          .logo-sub {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .meta-table td {
            padding: 8px 12px;
            font-size: 13px;
            border: 1px solid #f1f5f9;
          }
          .meta-label {
            font-weight: 600;
            color: #475569;
            background-color: #f8fafc;
            width: 20%;
          }
          .meta-val {
            width: 30%;
          }
          .report-title {
            text-align: center;
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 25px;
            color: #1e293b;
          }
          .content-grid {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
          }
          .image-col {
            flex: 2;
          }
          .mri-img {
            width: 100%;
            max-height: 320px;
            object-fit: contain;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background-color: #f8fafc;
          }
          .results-col {
            flex: 3;
          }
          .result-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 18px;
            font-weight: 700;
            margin-top: 5px;
          }
          .badge-tumor {
            background-color: #fee2e2;
            color: #dc2626;
          }
          .badge-notumor {
            background-color: #d1fae5;
            color: #059669;
          }
          .score-row {
            margin-top: 15px;
          }
          .score-bar-bg {
            background-color: #e2e8f0;
            height: 8px;
            border-radius: 9999px;
            width: 100%;
            overflow: hidden;
            margin-top: 4px;
          }
          .score-bar-fill {
            background-color: #2563eb;
            height: 100%;
            border-radius: 9999px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-bottom: 12px;
            color: #0f172a;
          }
          .footer-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #e2e8f0;
            padding-top: 30px;
            font-size: 12px;
            color: #64748b;
          }
          .sig-line {
            width: 200px;
            border-top: 1px dashed #94a3b8;
            margin-top: 60px;
            text-align: center;
            padding-top: 5px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <!-- Header Kop Surat -->
        <table class="header-table">
          <tr>
            <td>
              <div class="logo-area">NEUROSCAN</div>
              <div class="logo-sub">Automated MRI Brain Analysis</div>
            </td>
            
          </tr>
        </table>

        <div class="report-title">Hasil Pemeriksaan Analisis Citra MRI</div>

        <!-- Meta info -->
        <table class="meta-table">
          <tr>
            <td class="meta-label">ID Laporan</td>
            <td class="meta-val"><strong>${reportId}</strong></td>
            <td class="meta-label">Tanggal Analisis</td>
            <td class="meta-val">${dateStr}</td>
          </tr>
          <tr>
            <td class="meta-label">Nama Operator</td>
            <td class="meta-val">${userName}</td>
            <td class="meta-label">Email</td>
            <td class="meta-val">${userEmail}</td>
          </tr>
          <tr>
            <td class="meta-label">Model Engine</td>
            <td class="meta-val">${modelName} (${modelVersion})</td>
            <td class="meta-label">Status Verifikasi</td>
            <td class="meta-val"><em>Hasil analisis awal berbasis AI</em></td>
          </tr>
        </table>

        <!-- Grid Citra & Statistik -->
        <div class="content-grid">
          <div class="image-col">
            <div class="section-title">Citra Input MRI</div>
            <img src="${imageMri}" class="mri-img" />
          </div>
          <div class="results-col">
            <div class="section-title">Klasifikasi Terdeteksi</div>
            <div>
              <div style="font-size: 12px; color: #64748b;">Prediksi Kelas Utama</div>
              <div class="result-badge ${predictedClass.toLowerCase().includes("notumor") || predictedClass.toLowerCase().includes("no tumor") ? "badge-notumor" : "badge-tumor"}">
              ${predictedClass}
              </div>
            </div>
            
            <div style="margin-top: 25px;" class="section-title">Probabilitas Kelas</div>
            ${sortedScores.map(s => `
              <div class="score-row">
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                  <span>${s.name}</span>
                  <strong>${s.vLabel}%</strong>
                </div>
                <div class="score-bar-bg">
                  <div class="score-bar-fill" style="width: ${s.val}%; background-color: ${
                    s.name.toLowerCase().includes("glioma") ? "#dc2626" : 
                    s.name.toLowerCase().includes("meningioma") ? "#a855f7" : 
                    s.name.toLowerCase().includes("pituitary") ? "#f59e0b" : "#10b981"
                  }"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Hasil Analisis Dinamis -->
        <div class="section-title">Hasil Interpretasi Model (AI Explanation)</div>
        ${clinicalDescriptionHTML}

        <!-- Gejala Klinis & Rekomendasi Tindak Lanjut -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 25px; margin-bottom: 25px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <div class="section-title">Gejala Klinis Terkait</div>
              <ul style="font-size: 11px; color: #475569; padding-left: 15px; margin: 0; line-height: 1.6;">
                ${getClinicalSymptoms(predictedClass).map(s => `<li>${s}</li>`).join("")}
              </ul>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px; border-left: 1px solid #e2e8f0;">
              <div class="section-title">Rekomendasi Tindak Lanjut</div>
              <ol style="font-size: 11px; color: #475569; padding-left: 15px; margin: 0; line-height: 1.6;">
                ${getClinicalNextSteps(predictedClass).map(s => `<li>${s}</li>`).join("")}
              </ol>
            </td>
          </tr>
        </table>

        <div style="margin-top: 15px;" class="section-title">Disklaimer Medis</div>
        <div style="font-size: 10px; color: #64748b; text-align: justify; line-height: 1.4;">
          Laporan ini dihasilkan secara otomatis oleh sistem kecerdasan buatan (NeuroScan AI) berbasis Convolutional Neural Network (CNN). Analisis ini bertujuan sebagai alat bantu penapisan awal (screening tool) dan keputusan klinis, bukan merupakan diagnosis medis final. Hasil analisis ini wajib dikorelasikan dengan gejala klinis pasien, riwayat kesehatan, dan hasil pemeriksaan penunjang lainnya. Hasil analisis dapat dipengaruhi oleh kualitas citra MRI, variasi data, dan keterbatasan model pembelajaran mesin. Keputusan medis definitif sepenuhnya berada di bawah wewenang dokter spesialis radiologi atau spesialis saraf.
        </div>


        <!-- Tanda Tangan / Footer -->
        <div class="footer-section">
          <div>
            Dokumen ID: <strong>${reportId}</strong><br/>
            Dicetak secara elektronik pada: ${format(new Date(), "dd MMMM yyyy, HH:mm")}
          </div>
          <div>
            <div class="sig-line">
              Dokter Spesialis Radiologi / Operator
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Cetak menggunakan iframe tersembunyi
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Tunggu gambar selesai diload sebelum melakukan pencetakan
    const imgElement = doc.querySelector("img");
    if (imgElement) {
      imgElement.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
      imgElement.onerror = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      };
    } else {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }
  }
}
