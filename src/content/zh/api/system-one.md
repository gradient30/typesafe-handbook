# System One

> 针对 `state` 中提供的内容，回答一个或多个问题。

一次请求可以混用多种问题类型。答案使用与问题相同的名字，便于把结果对应回问题。响应还包含所用模型与 token 用量。



## OpenAPI

````yaml https://api.typesafe.ai/openapi.json post /v1/systemone
openapi: 3.1.0
info:
  title: TypeSafe
  description: >-
    对你的内容提出是/否问题、评估陈述、选择选项，或给出评分。在 Authorization 头中以 `Bearer
    <API_KEY>` 发送 API key。用 GET /v1/models 发现可用模型名。
  version: 0.2.0
servers:
  - url: https://api.typesafe.ai
security: []
paths:
  /v1/systemone:
    post:
      summary: System One
      description: >-
        针对 `state` 中提供的内容，回答一个或多个问题。


        一次请求可以混用多种问题类型。答案使用与问题相同的名字，

        便于把结果对应回问题。响应还包含

        所用模型与 token 用量。
      operationId: systemone_v1_systemone_post
      parameters:
        - name: TypeSafe-Danger-Zone-Images
          in: header
          description: 设为 true 以使用 assets 或 box 问题。
          schema:
            type: string
            enum:
              - 'true'
          example: 'true'
        - name: TypeSafe-Danger-Zone-Long-Context
          in: header
          description: 设为 true 以使用 long context。
          schema:
            type: string
            enum:
              - 'true'
          example: 'true'
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SystemOneRequest'
            examples:
              noul:
                summary: Noul
                value:
                  model: jev-latest
                  state: >-
                    I was charged twice for my subscription this month. Please
                    refund the extra charge.
                  questions:
                    billing:
                      type: noul
                      instructions: Is this message about billing?
              choice:
                summary: Choice
                value:
                  model: jev-latest
                  state: >-
                    I was charged twice for my subscription this month. Please
                    refund the extra charge.
                  questions:
                    tone:
                      type: choice
                      instructions: What is the tone of this message?
                      criteria:
                        angry: An upset or hostile message
                        calm: A neutral or polite message
                        excited: An enthusiastic or eager message
              score:
                summary: Score
                value:
                  model: jev-latest
                  state: >-
                    I was charged twice for my subscription this month. Please
                    refund the extra charge.
                  questions:
                    urgency:
                      type: score
                      instructions: How urgent is this message?
                      criteria:
                        - Can wait
                        - Needs attention this week
                        - Needs attention today
              box:
                summary: 'Box (requires TypeSafe-Danger-Zone-Images: true)'
                value:
                  model: jev-preview
                  state: photo
                  questions:
                    red_rectangle:
                      type: box
                      instructions: Locate the red rectangle.
                  assets:
                    photo:
                      type: image
                      format: png
                      data_base64: >-
                        iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHElEQVR4nGP4TyJgoKcGBgbsaFQDfTUQB4aDBgDAen2fpitsVAAAAABJRU5ErkJggg==
          multipart/form-data:
            schema:
              type: object
              description: >-
                第一部分为名为 request 的 JSON 请求，随后每个图像各自作为一部分。每个图像部分需要唯一、
                非空的名字，且必须恰好被一个 asset 的 part 使用。
              properties:
                request:
                  description: JSON 请求，作为第一部分。
                  contentMediaType: application/json
                  contentSchema:
                    $ref: '#/components/schemas/SystemOneRequest'
              required:
                - request
              additionalProperties:
                type: string
                description: 图像，名字由使用它的 asset part 指定。
                contentMediaType: image/*
            encoding:
              request:
                contentType: application/json
        required: true
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SystemOneResponse'
              examples:
                noul:
                  summary: Noul
                  value:
                    model: jev-latest
                    answers:
                      billing:
                        type: noul
                        noul: 0.98
                    usage:
                      input_tokens: 120
                      output_tokens: 12
                choice:
                  summary: Choice
                  value:
                    model: jev-latest
                    answers:
                      tone:
                        type: choice
                        choice: calm
                        confidence: 0.7
                        probabilities:
                          angry: 0.15
                          calm: 0.8
                          excited: 0.05
                    usage:
                      input_tokens: 120
                      output_tokens: 12
                score:
                  summary: Score
                  value:
                    model: jev-latest
                    answers:
                      urgency:
                        type: score
                        score: 1.7
                        confidence: 0.55
                        legend:
                          '0': Can wait
                          '1': Needs attention this week
                          '2': Needs attention today
                        probabilities:
                          '0': 0.1
                          '1': 0.1
                          '2': 0.8
                    usage:
                      input_tokens: 120
                      output_tokens: 12
                box:
                  summary: Box
                  value:
                    model: jev-preview
                    answers:
                      red_rectangle:
                        type: box
                        box:
                          top: 0.2
                          bottom: 0.66
                          left: 0.19
                          right: 0.68
                        confidence: null
                    usage:
                      input_tokens: 285
                      output_tokens: 20
        '422':
          description: Validation Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HTTPValidationError'
      security:
        - HTTPBearer: []
components:
  schemas:
    SystemOneRequest:
      properties:
        model:
          type: string
          title: Model
          description: >-
            要使用的模型名或别名。可用名字由 GET /v1/models 返回。
          examples:
            - jev-latest
        state:
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
          x-accepts: string | object | array
          title: State
          description: 本请求中所有问题所针对的内容。
          examples:
            - I was charged twice. Please help.
            - message: Please help.
              subject: Duplicate charge
        questions:
          additionalProperties:
            $ref: '#/components/schemas/Question'
          type: object
          minProperties: 1
          title: Questions
          description: >-
            关于该内容要问的问题，每个问题由你命名。响应用这些名字标识答案。
          examples:
            - billing:
                instructions: Is this message about billing?
                type: noul
        assets:
          additionalProperties:
            $ref: '#/components/schemas/Asset'
          type: object
          minProperties: 1
          title: Assets
          description: >-
            以不透明占位符为键的媒体资源（建议每个图像使用 UUID）。占位符出现在 state、问题 instructions
            或 criteria 的字符串中（作为整个值或嵌入其中）时，会被替换为对应 asset。图像 asset 需要视觉语言模型。
      type: object
      required:
        - model
        - state
        - questions
      title: SystemOneRequest
      description: 用 TypeSafe 模型一并评估的内容与具名问题。
    SystemOneResponse:
      properties:
        model:
          type: string
          title: Model
          description: >-
            实际作答的模型名。可能与请求中提供的别名不同。
          examples:
            - jev-latest
        answers:
          additionalProperties:
            $ref: '#/components/schemas/Answer'
          type: object
          minProperties: 1
          title: Answers
          description: >-
            以请求中问题名为键的答案。每个答案的 type 与对应问题的 type 一致。
          examples:
            - billing:
                noul: 0.98
                type: noul
        usage:
          $ref: '#/components/schemas/Usage'
          description: 本次评估的输入与输出 token 计数。
          examples:
            - input_tokens: 120
              output_tokens: 12
      type: object
      required:
        - model
        - answers
        - usage
      title: SystemOneResponse
      description: 按问题名分组的答案，以及所用模型与 token 用量。
    HTTPValidationError:
      properties:
        detail:
          items:
            $ref: '#/components/schemas/ValidationError'
          type: array
          title: Detail
          description: >-
            说明哪些请求值缺失或无效的校验错误。
          examples:
            - - loc:
                  - body
                  - state
                msg: Field required
                type: missing
      type: object
      title: HTTPValidationError
      description: 随 HTTP 状态 422 返回的请求校验失败。
    Question:
      oneOf:
        - $ref: '#/components/schemas/NoulQuestion'
          title: Noul
        - $ref: '#/components/schemas/ChoiceQuestion'
          title: Choice
        - $ref: '#/components/schemas/ScoreQuestion'
          title: Score
        - $ref: '#/components/schemas/BoxQuestion'
          title: Box
      discriminator:
        propertyName: type
        mapping:
          noul: '#/components/schemas/NoulQuestion'
          choice: '#/components/schemas/ChoiceQuestion'
          score: '#/components/schemas/ScoreQuestion'
          box: '#/components/schemas/BoxQuestion'
      description: 关于所提供内容的一个问题。
    Asset:
      properties:
        type:
          type: string
          const: image
          title: Type
          description: 标识图像 asset。
        format:
          type: string
          enum:
            - png
            - jpg
            - jpeg
          title: Format
          description: >-
            图像格式，与 data_base64 一起使用时必填。实际格式由字节内容检测。
        data_base64:
          type: string
          title: Data Base64
          description: Base64 编码的图像数据。
        part:
          type: string
          title: Part
          description: >-
            在 multipart 请求中，本 asset 使用的图像部分名。提供 part 时会忽略 data_base64。
      type: object
      title: Asset
      description: >-
        替换其占位符的图像：要么是 data_base64 中的字节及其 format，要么在 multipart 请求中是承载图像的部分名。
        含图像的请求必须发送头 TypeSafe-Danger-Zone-Images: true。
    Answer:
      oneOf:
        - $ref: '#/components/schemas/NoulAnswer'
          title: Noul
        - $ref: '#/components/schemas/ChoiceAnswer'
          title: Choice
        - $ref: '#/components/schemas/ScoreAnswer'
          title: Score
        - $ref: '#/components/schemas/BoxAnswer'
          title: Box
      discriminator:
        propertyName: type
        mapping:
          noul: '#/components/schemas/NoulAnswer'
          choice: '#/components/schemas/ChoiceAnswer'
          score: '#/components/schemas/ScoreAnswer'
          box: '#/components/schemas/BoxAnswer'
      description: type 与对应问题一致的答案。
    Usage:
      properties:
        input_tokens:
          type: integer
          title: Input Tokens
          description: 评估该请求所用的计费输入 token 数。
          examples:
            - 120
        output_tokens:
          type: integer
          title: Output Tokens
          description: >-
            回答问题所用的输出 token 数。输出 token 目前免费。
          examples:
            - 12
      type: object
      required:
        - input_tokens
        - output_tokens
      title: Usage
      description: 该请求的 token 用量。
    ValidationError:
      properties:
        loc:
          items:
            anyOf:
              - type: string
              - type: integer
          type: array
          title: Location
          description: >-
            无效值的路径：请求位置，后接字段名与数组下标。
          examples:
            - - body
              - questions
              - urgency
              - score
              - criteria
        msg:
          type: string
          title: Message
          description: 对校验失败的人类可读说明。
          examples:
            - Field required
        type:
          type: string
          title: Error Type
          description: 机器可读的校验错误码。
          examples:
            - missing
        input:
          title: Input
          description: 未通过校验的输入值。
          examples:
            - type: score
        ctx:
          type: object
          title: Context
          description: 用于解释校验失败的额外上下文。
          examples:
            - min_length: 1
      type: object
      required:
        - loc
        - msg
        - type
      title: ValidationError
      description: 某个字段或数组元素上的请求校验错误。
    NoulQuestion:
      properties:
        type:
          type: string
          const: noul
          title: Type
          description: 标识是/否问题或陈述。
          examples:
            - noul
        instructions:
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
            - type: 'null'
          x-accepts: string | object | array
          title: Instructions
          description: 要评估的是/否问题或陈述。
          examples:
            - Is this message spam?
            - This message contains unsolicited advertising.
            - task: Identify unsolicited advertising.
        criteria:
          anyOf:
            - $ref: '#/components/schemas/NoulCriteria'
            - type: 'null'
          description: 澄清何为 yes / no 答案的准则。
          examples:
            - 'false': A legitimate conversation
              'true': Unsolicited advertising
      type: object
      required:
        - type
      title: NoulQuestion
      description: >-
        是/否问题或陈述，返回答案为 yes 或 true 的概率。
    ChoiceQuestion:
      properties:
        type:
          type: string
          const: choice
          title: Type
          description: 标识从 criteria 中选项里选一个的问题。
          examples:
            - choice
        instructions:
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
            - type: 'null'
          x-accepts: string | object | array
          title: Instructions
          description: 模型在选择选项时应判定什么。
          examples:
            - What is the tone of this message?
        criteria:
          additionalProperties:
            anyOf:
              - type: string
              - additionalProperties: true
                type: object
              - items: {}
                type: array
              - type: 'null'
            x-accepts: string | object | array
          type: object
          minProperties: 1
          maxProperties: 255
          title: Criteria
          description: >-
            选项名以及各自适用时机的描述。没有描述的选项仅按名称解释。
          examples:
            - angry: An upset or hostile message
              calm: A neutral or polite message
              excited: An enthusiastic or eager message
      type: object
      required:
        - type
        - criteria
      title: ChoiceQuestion
      description: 从你定义的选项中选出一项的问题。
    ScoreQuestion:
      properties:
        type:
          type: string
          const: score
          title: Type
          description: >-
            标识用 criteria 中的级别对内容评分的问题。
          examples:
            - score
        instructions:
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
            - type: 'null'
          x-accepts: string | object | array
          title: Instructions
          description: 模型应对什么评分。
          examples:
            - How urgent is this message?
        criteria:
          items:
            anyOf:
              - type: string
              - additionalProperties: true
                type: object
              - items: {}
                type: array
            x-accepts: string | object | array
          type: array
          minItems: 1
          maxItems: 10
          title: Criteria
          description: >-
            有序的评分级别描述。每个描述的位置决定其分数，从零开始。
          examples:
            - - Can wait
              - Needs attention this week
              - Needs attention today
      type: object
      required:
        - type
        - criteria
      title: ScoreQuestion
      description: 用有序量规给出分数的问题。
    BoxQuestion:
      properties:
        type:
          type: string
          const: box
          title: Type
          description: 标识 box 问题。
        instructions:
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
            - type: 'null'
          x-accepts: string | object | array
          title: Instructions
          description: 要在图像中定位的内容。
      type: object
      required:
        - type
      title: BoxQuestion
      description: >-
        在请求图像中定位 instructions 所描述内容的问题。含 box 问题的请求必须发送头
        TypeSafe-Danger-Zone-Images: true。
    NoulAnswer:
      properties:
        type:
          type: string
          const: noul
          title: Type
          description: 标识是/否答案。
          examples:
            - noul
        noul:
          type: number
          title: Noul
          description: >-
            答案为 yes 或陈述为 true 的概率，范围 0 到 1。接近 1 偏向 yes/true，接近 0 偏向 no/false，接近 0.5 表示不确定。
          examples:
            - 0.98
      type: object
      required:
        - type
        - noul
      title: NoulAnswer
      description: 答案为 yes 或陈述为 true 的概率。
    ChoiceAnswer:
      properties:
        type:
          type: string
          const: choice
          title: Type
          description: 标识从请求选项中做出的选择。
          examples:
            - choice
        choice:
          type: string
          title: Choice
          description: >-
            在问题 criteria 中概率最高的选项名。
          examples:
            - angry
        confidence:
          type: number
          title: Confidence
          description: >-
            对所选选项的置信度，范围 0 到 1。越高越确定；较低值可用于把不确定选择标出供复核。
          examples:
            - 0.9
        probabilities:
          additionalProperties:
            type: number
          type: object
          title: Probabilities
          description: >-
            criteria 中每个选项的概率，以选项名为键，范围 0 到 1。展示其他选项的可能性；各值之和约等于 1。
          examples:
            - angry: 0.8
              calm: 0.1
              excited: 0.1
      type: object
      required:
        - type
        - choice
        - confidence
        - probabilities
      title: ChoiceAnswer
      description: >-
        choice 问题的所选选项、置信度与概率分布。
    ScoreAnswer:
      properties:
        type:
          type: string
          const: score
          title: Type
          description: 标识对照请求评分级别给出的评分。
          examples:
            - score
        score:
          type: number
          title: Score
          description: >-
            期望分数：量规各级别的概率加权平均。可能落在整数级别之间。
          examples:
            - 1.7
        confidence:
          type: number
          title: Confidence
          description: >-
            对该分数的置信度，范围 0 到 1。越高越确定；较低值可用于把不确定评分标出供复核。
          examples:
            - 0.9
        legend:
          additionalProperties:
            anyOf:
              - type: string
              - additionalProperties: true
                type: object
              - items: {}
                type: array
            x-accepts: string | object | array
          type: object
          title: Legend
          description: >-
            请求的 criteria 映射到对应评分级别，便于解读分数。
          examples:
            - '0': Can wait
              '1': Needs attention this week
              '2': Needs attention today
        probabilities:
          additionalProperties:
            type: number
          type: object
          title: Probabilities
          description: >-
            每个评分级别的概率，范围 0 到 1，键与 legend 相同。展示其他级别的可能性；各值之和约等于 1。
          examples:
            - '0': 0.1
              '1': 0.1
              '2': 0.8
      type: object
      required:
        - type
        - score
        - confidence
        - legend
        - probabilities
      title: ScoreAnswer
      description: >-
        带量规、置信度与各级别概率的期望分数。
    BoxAnswer:
      properties:
        type:
          type: string
          const: box
          title: Type
          description: 标识 box 答案。
          examples:
            - box
        box:
          $ref: '#/components/schemas/BoxCoordinates'
          description: >-
            框的边缘，表示为图像高度与宽度的比例，范围 0 到 1。每个坐标是该边预测位置的期望值。
          examples:
            - bottom: 0.66
              left: 0.19
              right: 0.68
              top: 0.2
        confidence:
          anyOf:
            - type: number
            - type: 'null'
          title: Confidence
          description: >-
            给定框的置信度，范围 0 到 1，1 表示更有把握。模型未提供置信度时为 null。
          examples:
            - null
            - 0.9
      type: object
      required:
        - type
        - box
        - confidence
      title: BoxAnswer
      description: 带归一化边缘坐标与置信度的定位框。
    NoulCriteria:
      properties:
        'true':
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
            - type: 'null'
          x-accepts: string | object | array
          title: 'True'
          description: 何为 yes 答案。
          examples:
            - The message is unsolicited advertising.
        'false':
          anyOf:
            - type: string
            - additionalProperties: true
              type: object
            - items: {}
              type: array
            - type: 'null'
          x-accepts: string | object | array
          title: 'False'
          description: 何为 no 答案。
          examples:
            - The message is a legitimate conversation.
      type: object
      title: NoulCriteria
      description: 定义何为 yes / no 答案的准则。
    BoxCoordinates:
      properties:
        top:
          type: number
          title: Top
          description: >-
            框的上边缘，相对图像顶部的高度比例（0-1）。
          examples:
            - 0.2
        bottom:
          type: number
          title: Bottom
          description: >-
            框的下边缘，相对图像顶部的高度比例（0-1）。
          examples:
            - 0.66
        left:
          type: number
          title: Left
          description: >-
            框的左边缘，相对图像左侧的宽度比例（0-1）。
          examples:
            - 0.19
        right:
          type: number
          title: Right
          description: >-
            框的右边缘，相对图像左侧的宽度比例（0-1）。
          examples:
            - 0.68
      type: object
      required:
        - top
        - bottom
        - left
        - right
      title: BoxCoordinates
      description: >-
        归一化的框边缘。纵向坐标从图像顶部度量；横向坐标从左侧度量。
  securitySchemes:
    HTTPBearer:
      type: http
      scheme: bearer

````

