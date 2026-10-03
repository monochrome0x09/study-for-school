# 스캔 추출 형식과 절차

시험지·교재 스캔(이미지)에서 영문 본문, 각주, 손필기, 인쇄된 해석을 뽑아 이후 본문 분석과 다른 모의고사 공부에 재사용하기 위한 형식입니다. 추출 결과(지문 내용 포함)는 `docs/sources/private/extracted/`에만 두고 git에 올리지 않습니다(`docs/sources/README.md`의 규칙). 이 문서와 `tools/`에는 지문 내용이 없습니다.

## 파일

| 위치 | 내용 | git |
| --- | --- | --- |
| `private/extracted/<세트>.json` | 한 시험(또는 한 교재 범위)의 정본. 아래 스키마 | 제외 |
| `private/extracted/md/qNN.md` | 사람이 검수하기 쉬운 문장별 보기(영문, 해석, 손필기) | 제외 |
| `private/extracted/txt/qNN.txt` | 앱 지문 등록 화면에 붙여넣을 영문만 | 제외 |
| `private/extracted/REVIEW.md` | 낮은 신뢰도 손필기 목록(원본 대조용) | 제외 |
| `tools/validate-extraction.mjs` | JSON 검증 | 추적 |
| `tools/render-extraction.mjs` | JSON → md / txt / REVIEW.md | 추적 |

```
node docs/sources/tools/validate-extraction.mjs docs/sources/private/extracted/<세트>.json
node docs/sources/tools/render-extraction.mjs   docs/sources/private/extracted/<세트>.json docs/sources/private/extracted
```

## 스키마 (schema_version 1)

```jsonc
{
  "schema_version": 1,
  "source": { "file": "...", "exam": "9월 학평", "year": null, "track": "학평",
              "title_note": "...", "material": "...", "extracted_on": "YYYY-MM-DD",
              "method": "...", "reviewed_by_human": false },
  "passages": [{
    "number": 19,                 // 문항 번호(교과서면 단원 등 식별자로 바꿔 쓸 수 있음)
    "page": 1,                    // 스캔 PDF의 쪽
    "printed_title": "...",       // 스캔에 인쇄된 제목 그대로
    "page_notes": [{ "text": "", "placement": "", "confidence": "high|medium|low", "related_anchor": "" }],
    "english": "...",             // 인쇄된 영문 본문만. 손필기를 섞지 않는다
    "printed_markers": false,     // 본문에 ①~⑤가 인쇄되어 있으면(어법·삽입 문항 등) true. 아니면 검증기가 원문자를 경고함
    "italics": ["..."],           // 인쇄에서 기울임체인 구절(본문에는 서식 없이 포함)
    "footnotes": [{ "marker": "*", "term": "", "gloss": "" }],
    "annotations": [{             // 손필기 한 건당 하나
      "anchor": "...",            // english 안의 정확한 부분 문자열(단어 경계가 맞아야 함)
      "occurrence": 1,            // anchor가 여러 번 나올 때 몇 번째인지
      "kind": "vocab|grammar|chunk-slash|underline|circle|arrow|bracket|insertion|other",
      "text": "...",              // 손으로 쓴 글자. 표시만 있으면 빈 문자열, 못 읽으면 [판독불가]
      "confidence": "high|medium|low",
      "sentence": 0,              // anchor가 시작하는 문장의 번호(0부터)
      "note": "..."               // 위치·모양·불확실한 이유
    }],
    "korean": "...",              // 인쇄된 해석 전체
    "korean_sentences": ["..."],  // 해석을 문장으로 나눈 것(공백으로 이으면 korean과 같음)
    "korean_occluded": [],        // 손가락·그림자로 가려 못 읽은 구간(추측해 채우지 않음)
    "korean_note": "...",
    "sentences": [{ "en": "...", "ko": "...", "ko_indices": [0] }]  // 앱의 splitSentences 결과와 같은 영문 문장 + 짝 맞춘 해석
  }]
}
```

- `kind` 의미: `vocab` 어휘 뜻, `grammar` 문법 용어·기호(S, V, P.P, = which 등), `chunk-slash` 끊어 읽기 사선, `underline` 밑줄, `circle` 동그라미, `arrow` 화살표·연결선, `bracket` 괄호로 묶은 범위, `insertion` 생략 복원(^ 와 괄호 글), `other` 그 밖.
- `sentences[].en`은 `lib/sentences`의 `splitSentences(english)` 결과여야 합니다(앱에 등록할 때 문장 번호가 같아지도록). 영어 문장 수와 해석 문장 수가 다르면(콜론·세미콜론으로 이어진 문장 등) 억지로 합치지 말고 `ko_indices`에 여러 개를 적어 짝을 지정합니다.
- `korean_sentences`는 이렇게 나눴습니다: `.`·`?`·`!`와 닫는 따옴표·괄호(`’ ” ) ]`) 뒤 공백에서 나누되, 닫는 큰따옴표(`”`) 바로 뒤에 한글이 오면(예: `…일이에요?” 그녀가 물었다.` 같은 말하는 이 표현) 나누지 않습니다. 영어 문장 수와 맞지 않는 지문은 아래 `ko_indices`를 손으로 지정합니다. 예: 영어 문장 하나가 콜론이나 세미콜론으로 이어져 해석이 둘로 나뉜 경우 `[[0],[1],[2],[3],[4,5],[6],[7]]`처럼 해당 영어 문장에 해석 인덱스 둘을 묶습니다.
- 연도처럼 스캔에 없는 값은 만들지 않고 `null`로 둡니다.

## 추출 절차

1. `pdfimages -j <PDF> <접두어>`로 쪽 이미지를 원래 해상도(약 2000×3200)로 꺼냅니다.
2. ImageMagick `convert -crop`으로 본문을 가로 구간 2~3장(겹치게), 해석 블록을 1장으로 자릅니다. 확대해 읽을 수 있어야 하며 구간 경계에서 줄이 잘리지 않았는지 확인합니다.
3. 세 층을 섞지 않고 적습니다: 인쇄 영문(`english`), 인쇄 각주(`footnotes`), 손필기(`annotations`). 줄 끝 하이픈 단어는 이어서 적고(`in-` + `group` → `in-group`), 손필기가 본문에 새어 들어가지 않게 합니다(손으로 쓴 ①②③ 주의).
4. 영문 본문은 **다른 구간 경계로 한 번 더** 읽어 두 판독을 글자 단위로 비교합니다. 다르면 이미지를 다시 확인해 해소합니다.
5. 손필기는 읽을 수 없으면 `[판독불가]`와 `low`로 적고 추측하지 않습니다. 문맥으로 읽었다면 `low`와 함께 note에 이유를 적습니다. 가려진 해석 구간은 `korean_occluded`에 적습니다.
6. 영문 문장 분할은 앱의 `splitSentences`로 하고(임시 jest 파일로 실행) 이상한 분할은 분할기를 고치기 전에 먼저 보고합니다.
7. `validate-extraction.mjs`를 통과시킨 뒤 `render-extraction.mjs`로 md / txt / REVIEW.md를 만듭니다.
8. 사람이 `REVIEW.md`의 항목과 스캔 원본을 대조하고 JSON의 `reviewed_by_human`을 갱신합니다.

## 한계

- 판독은 AI가 사진을 읽은 것이라 손필기(특히 작은 글씨·흐린 글씨)는 틀릴 수 있습니다. 영문 본문은 두 번 읽어 일치했지만 두 판독이 완전히 독립적이지는 않습니다.
- 해석(한국어)은 한 번만 읽었고 문장 대응으로 영문과 내용이 맞는지만 확인했습니다.
- 앱은 이 추출 JSON을 직접 읽지 않습니다. 아래 "가져오기 묶음"으로 바꿔서 앱의 일괄 가져오기에 붙여넣습니다.

## 교과서 추출(`private/textbook/`)

스캔 PDF 대신 Google Drive의 텍스트 변환본으로 만든 인쇄체 본문 추출입니다. 스키마(`version: 1`):

```jsonc
{
  "source": { "title", "origin", "coverage", "page_offset", "reliability", "status" },
  "passages": [{
    "id": "L1-read-01",           // L<과>-<read|culture>-<번호>
    "lesson": 1, "title": "...", "kind": "reading|culture",
    "pdf_page": 8, "printed_page": 15,   // 인쇄 쪽 = PDF 쪽 + 7
    "english": "...",             // 줄 번호(5·10·15)와 줄 바꿈을 지운 본문. 각주 표지 *는 그대로
    "footnotes": ["*pertussis ..."]
  }],
  "page_vocab_lists": { "8": ["deadly", "..."] },   // 쪽 아래 어휘 목록(뜻 없음)
  "handwriting_ocr_raw": { "8": "..." }             // 손글씨 자동 인식 원문. 대부분 깨져 있어 판독본이 아님
}
```

- `txt/<id>.txt`는 지문 등록 화면에 붙여넣는 형태입니다(`*` 각주는 별도 줄).
- 손글씨는 `textbook-handwriting.json`에 따로 있습니다(아래). 교과서에는 인쇄된 해석이 없어 `ko`는 만들지 않았습니다.

## 가져오기 묶음(앱의 일괄 가져오기)

앱 `지문` 탭의 "JSON으로 한꺼번에 가져오기"에 붙여넣는 형식입니다(`mobile/src/lib/importer/`가 읽고 검증). 컴퓨터에서 만든 파일을 iPhone으로 옮겨(AirDrop·메모·메시지 등) 내용을 복사해 붙여넣습니다. 한 번에 붙여넣기 부담스러우면 지문별 파일을 씁니다.

```jsonc
{
  "version": 1,
  "passages": [{
    "track": "교과서" | "학평",
    "source_book": "…", "source_unit": "1과 본문 1",             // 교과서: 단원 필수
    "source_year": 2025, "source_month": 9, "source_number": 19,  // 학평: 셋 다 필수(번호 18~45)
    "text": "…",                                  // 앱의 문장 나누기로 나눔
    "sentences": [{ "en": "…", "ko": "…", "note": "…" }],  // text 대신 이미 나눈 문장(해석·메모 포함)
    "vocab": [{ "word": "…", "meaning": "…", "sentence": 0 }]   // sentence는 0부터 시작하는 문장 번호(선택)
  }]
}
```

- `text`와 `sentences` 중 하나가 필요합니다. 둘 다 있으면 `sentences`를 씁니다. 스캔 추출 JSON의 `sentences[].en`은 앱의 `splitSentences` 결과라 해석·메모의 문장 번호가 맞습니다.
- 하나라도 틀리면 아무것도 등록하지 않고 어느 지문의 무엇이 틀렸는지 보여줍니다.
- 같은 출처의 지문(교과서: 책+단원, 학평: 연·월·번호)이 이미 있으면 덮어쓰지 않고 건너뜁니다. 앱에서 고친 해석·메모를 지키기 위해서입니다. 다시 가져오려면 앱에서 그 지문을 먼저 지웁니다.
- 지문마다 한 번의 저장(트랜잭션)이라 한 지문은 전부 들어가거나 하나도 안 들어갑니다.

### 스캔 추출 JSON → 가져오기 묶음

```
node docs/sources/tools/to-import-bundle.mjs <추출.json> <출력 폴더> --year 2025 --month 9 [--vocab]
```

- 연도는 스캔에 없을 수 있어 `--year`로 직접 지정해야 합니다(추측하지 않음). `--month`는 `source.exam`("9월 학평")에서 알 수 있으면 생략할 수 있습니다.
- `ko`는 해석 문장, `note`는 글자가 있는 손필기를 `어휘 단어: 뜻` 꼴 줄로 모은 것입니다. 낮은 신뢰도 항목은 끝에 `(?)`. 글자가 없는 표시(밑줄·동그라미·끊어 읽기·괄호)는 메모에 넣지 않습니다.
- `--vocab`: 한글 뜻이 있고 낮은 신뢰도가 아닌 `vocab` 손필기와 각주 풀이를 단어장 항목으로 만듭니다(영어 뜻풀이 `= fatal` 같은 것은 제외).
- 교과서 텍스트 추출(`private/textbook/`)은 지문 묶는 방식이 사용자 결정이라 도구 없이 한 번 만들었습니다(`import/textbook/`).

### 교과서 손글씨(`private/textbook/textbook-handwriting.json`)

```jsonc
{ "version": 1, "source": { … },
  "passages": [{
    "id": "L2-read-07", "pdf_page": 39, "printed_page": 46,
    "sentences": ["…"],                       // 앱의 splitSentences 결과(가져오기 묶음과 같은 문장 번호)
    "annotations": [{ "sentence": 3, "kind": "vocab|grammar|other", "anchor": "…", "text": "…", "confidence": "high|medium|low", "note": "…" }],
    "sticky": ["본문 구조화", "1. …", "…", "본문 주제", "…"],   // 쪽에 붙은 스티커 메모
    "sticky_note": null                       // 스티커가 다른 지문과 걸쳐 있는 경우의 설명
  }] }
```

- 쪽 PDF를 150dpi로 렌더링해 줄 단위로 잘라 2배로 확대해 읽었습니다. 앵커가 해당 문장에 실제로 있는지 전부 확인했습니다(278개 중 12개를 고침).
- 가져오기 묶음으로 바꿀 때 `note`는 `어휘 단어: 뜻` 꼴 줄이 되고(낮은 신뢰도는 `(?)`), 스티커 메모는 첫 문장 메모 끝에 `[스티커 메모] …`로 붙습니다. 한글 뜻이 있는 낮은 신뢰도 아닌 어휘는 단어장 항목도 됩니다.
- 한계: 글자 없는 표시는 담지 않았고, 파란 글씨(어휘)와 빨간 글씨(문법)는 색이 아니라 내용으로 `kind`를 정했습니다. 읽지 못한 글자는 `[판독불가]`입니다.
