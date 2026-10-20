# List models

> 列出当前鉴权账号可用的模型与别名。

把返回的模型名作为 `model`，用于 `POST /v1/systemone` 请求。

## OpenAPI

````yaml https://api.typesafe.ai/openapi.json get /v1/models
openapi: 3.1.0
info:
  title: TypeSafe
  description: >-
    对你的内容提出是/否问题、评估陈述、选择选项，或给出评分。
    在 Authorization 头中以 `Bearer <API_KEY>` 发送 API key。
    用 GET /v1/models 发现可用模型名。
  version: 0.2.0
servers:
  - url: https://api.typesafe.ai
security: []
paths:
  /v1/models:
    get:
      summary: List models
      description: |-
        列出当前鉴权账号可用的模型与别名。

        把返回的模型名作为 `model`，用于 POST /v1/systemone 请求。
      operationId: models_v1_v1_models_get
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModelMetadataList'
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
    ModelMetadataList:
      properties:
        models:
          items:
            $ref: '#/components/schemas/ModelMetadata'
          type: array
          title: Models
          description: >-
            可用模型与别名。在 POST /v1/systemone 请求中使用模型的 name。
          examples:
            - - description: General-purpose system one model.
                name: jev-latest
                release_date: '2026-09-15'
      type: object
      required:
        - models
      title: ModelMetadataList
      description: 当前鉴权账号可用的模型与别名。
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
    ModelMetadata:
      properties:
        name:
          type: string
          title: Name
          description: 请求的 model 字段可接受的模型名或别名。
          examples:
            - jev-latest
        description:
          type: string
          title: Description
          description: 对该模型及其能力的人类可读说明。
          examples:
            - General-purpose system one model.
        release_date:
          type: string
          title: Release Date
          description: 模型发布日期，格式为 YYYY-MM-DD。
          examples:
            - '2026-09-15'
      type: object
      required:
        - name
        - description
        - release_date
      title: ModelMetadata
      description: 当前鉴权账号可用的一个模型或模型别名。
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
  securitySchemes:
    HTTPBearer:
      type: http
      scheme: bearer

````
