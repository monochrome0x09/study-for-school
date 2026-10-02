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
- 앱에는 이 JSON을 읽어 들이는 기능이 아직 없습니다. 지금은 `txt/`의 영문을 지문 등록 화면에 붙여넣고 해석·메모를 직접 입력해야 합니다. JSON을 붙여넣어 지문·해석·메모를 한 번에 등록하는 "일괄 가져오기" 화면은 제안만 한 상태입니다.
