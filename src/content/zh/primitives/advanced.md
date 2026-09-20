# 高级：结构

> instructions、Choice 选项、Score 等级和 Noul criteria 都接受 JSON 结构。

System One 模型受过理解结构的训练。

## 哪里允许结构 {#where-structure-is-allowed}

下面每一个字段都是 [`EntryType`](/sdk/javascript/api/type-aliases/EntryType)。

| 字段 | 适用于 | 接受的形状 |
| --- | --- | --- |
| `instructions` | Choice、Score、Noul | `string`、`object`、`array` 或 `null` |
| `criteria` 的值（选项描述） | Choice | `string`、`object`、`array` 或 `null` |
| `criteria` 的项（等级描述） | Score | `string`、`object`、`array` 或 `null` |
| `criteria.true` 和 `criteria.false` | Noul | `string`、`object`、`array` 或 `null` |

## 何时给问题加结构 {#when-to-structure-a-question}

* **当它有助于说清。** 问题有多个部分时，写成 JSON 更清楚，因为键都有标签。
* **当问题需要配套数据。** schema、分类体系或数据库行本来就是 JSON。整段 JSON 拿来用，或只传入相关子字段，而不是把它们序列化进字符串模板。

## 结构化 instructions {#structured-instructions}

一个 `field` 对象描述正在检查的字段，每个问题用键引用它。同一种形状驱动一个校验取值的 Noul、一个从候选里选一项的 Choice，以及两个把取值放到量表上的 Score。

```json
{
  "state": {
    "source_text": "Invoice #4471 issued March 3, 2026 to Beaver Dam Logistics for $12,840.00, net 30."
  },
  "model": "jev-latest",
  "questions": {
    "invoice_number_is_correct": {
      "type": "noul",
      "instructions": {
        "field": {
          "name": "invoice_number",
          "type": "string",
          "description": "The identifier printed on the invoice."
        },
        "extracted_value": "4471",
        "question": "Does `extracted_value` match the `field` as it appears in `source_text`?"
      }
    },
    "customer_name": {
      "type": "choice",
      "instructions": {
        "field": {
          "name": "customer_name",
          "type": "string",
          "description": "The organization the invoice was issued to."
        },
        "question": "Which option is the value of `field` in `source_text`?"
      },
      "criteria": {
        "Beaver Logistics": null,
        "Dam Logistics": null,
        "Beaver Dam Logistics": null,
        "Beaver": null,
        "Dam": null
      }
    },
    "amount_due": {
      "type": "score",
      "instructions": {
        "field": {
          "name": "amount_due",
          "type": "number",
          "unit": "USD",
          "description": "The total the invoice asks to be paid."
        },
        "question": "How large is the `field` value in `source_text`?"
      },
      "criteria": [
        "Under $1,000",
        "$1,000 to $10,000",
        "$10,000 to $100,000",
        "$100,000 to $1,000,000",
        "Over $1,000,000"
      ]
    },
    "payment_terms": {
      "type": "score",
      "instructions": {
        "field": {
          "name": "payment_terms",
          "type": "integer",
          "unit": "days",
          "description": "Days allowed for payment, from terms such as \"net 30\"."
        },
        "question": "How many days does the `field` in `source_text` allow for payment?"
      },
      "criteria": [
        "Due on receipt",
        "Net 10",
        "Net 30",
        "Net 60",
        "Net 90"
      ]
    }
  }
}
```

在代码里，你可以遍历潜在记录，为每个字段构建其中一个问题，全部放进一次调用。[SDE 级联食谱](/cookbooks/sde_cascade) 做的事情与此类似。

数组也可以。当 instruction 是一份要检查或对照的清单时用它：

```json
"instructions": {
  "question": "Does the claimed sender identity conflict with the sending domain?",
  "compare": ["ticket.sender.display_name", "ticket.sender.email"],
  "focus": "Compare the named organization with the email domain."
}
```

## 结构化 Choice 选项 {#structured-choice-options}

Choice 选项的描述也可以是结构化对象。

### 用 JSON 量表澄清边界 {#json-rubric-for-boundary-clarification}

```json
{
  "state": "I ordered the standing desk two weeks ago and tracking still says label created. Was I even charged?",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": {
        "question": "Which team should handle this message?",
        "focus": "Classify the customer's primary request, not every topic mentioned."
      },
      "criteria": {
        "billing": {
          "what": "Charges, invoices, refunds, or subscriptions",
          "not_for": "Order tracking or account access",
          "examples": ["I was charged twice", "Where is my refund?"]
        },
        "orders": {
          "what": "Order status, delivery, cancellation, or returns",
          "not_for": "Charges or account access",
          "examples": ["Where is my package?", "Cancel my order"]
        },
        "account": {
          "what": "Login, password, profile, or security",
          "not_for": "Charges or delivery",
          "examples": ["I can't log in", "Change my email"]
        }
      }
    }
  }
}
```

这个例子告诉模型每个选项做什么、*不*做什么。它把选项之间的边界削得更利。

### 走分类树 {#walking-a-taxonomy}

要分到很深的分类体系里，每一级问一个 Choice，在代码里走这棵树。每一步的选项是当前节点的子节点，每个选项的值是这个子节点的子树。这样模型在选定一个分支之前能看到下面有什么，当条目属于某个叶子、而叶子名从分支名看不出来时，这一点很重要。

这里 state 是一条商品信息，第一个问题选顶层部门。

```json
{
  "state": "32oz plastic bottle with a flip straw lid. Fits most bike cages.",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which top-level department does this product belong to?",
      "criteria": {
        "Sporting Goods": {
          "Cycling": ["Bike Bottles & Cages", "Bike Lights", "Helmets"],
          "Fitness": ["Yoga Mats", "Resistance Bands"],
          "Outdoor": ["Tents", "Sleeping Bags", "Hydration Packs"]
        },
        "Home & Kitchen": {
          "Drinkware": ["Water Bottles", "Travel Mugs", "Tumblers"],
          "Cookware": ["Pots & Pans", "Bakeware"]
        },
        "Baby & Toddler": ["Sippy Cups", "Bottle Warmers", "Bibs"]
      }
    }
  }
}
```

这个瓶子合理地属于两个部门。把子树亮出来，模型就能看到 `Sporting Goods > Cycling > Bike Bottles & Cages` 和 `Home & Kitchen > Drinkware > Water Bottles` 都存在，再权衡商品描述对自行车水壶架的强调和日常饮具。这个答案上的 `probabilities` 会告诉你分裂是否近到值得两条分支都走。

选定部门之后，用该部门的子节点作选项、它们的子树作值，再问下一个 Choice，重复直到叶子。在代码里这可以是对嵌套 dict 的循环，每个问题的 `criteria` 就是当前节点。[层级分类食谱](/cookbooks/hierarchical_classification) 展示了类似的走树，包括当概率接近时用束搜索同时保留几条候选路径。

> 子树可能会很大。如果一个分支太大，就把值裁成直接子节点再加一批叶子样本。

## 结构化 Score 等级 {#structured-score-levels}

Score `criteria` 数组里的每一项都可以是对象。

```json
{
  "state": "Fixed the null check in the payment handler. Also refactored the retry loop while I was in there, and bumped the SDK version since the old one had that timeout bug.",
  "model": "jev-latest",
  "questions": {
    "pr_scope": {
      "type": "score",
      "instructions": {
        "question": "How focused is this pull request description on a single change?",
        "note": "Judge the number of independent changes, not the size of any one change."
      },
      "criteria": [
        {
          "summary": "One change, clearly stated",
          "signals": ["A single fix or feature", "Nothing described as \"also\" or \"while I was in there\""]
        },
        {
          "summary": "One main change plus a small related tweak",
          "signals": ["A primary change and one minor adjacent edit", "The tweak supports the main change"]
        },
        {
          "summary": "Several independent changes bundled together",
          "signals": ["Two or more unrelated fixes or features", "Changes that could each be their own PR"]
        }
      ]
    }
  }
}
```

## 结构化 Noul criteria {#structured-noul-criteria}

Noul 的 `criteria` 是可选的。当 yes/no 边界很细时，结构化的 `true` 和 `false` 描述可以在每一侧用定义和例子把它钉住。

```json
{
  "state": {
    "sender": { "display_name": "Beaver Dam Builders Ltd.", "email": "donotreply@payroll.example" },
    "message": "Your Q3 bonus is ready. Reply with your login password so we can verify your identity and release the funds."
  },
  "model": "jev-latest",
  "questions": {
    "requests_credentials": {
      "type": "noul",
      "instructions": {
        "question": "Does the `message` ask the recipient to disclose a sensitive credential?",
        "inspect": "message",
        "focus": "Look for a request to send the credential itself, not a request to change or reset it."
      },
      "criteria": {
        "true": {
          "what": "Asks the recipient to reply with, type, or send a password, PIN, one-time code, or other security sensitive answer",
          "examples": ["Reply with your password", "Send us the 6-digit code you just received"]
        },
        "false": {
          "what": "No sensitive credential is requested",
          "examples": ["Reset your password from the settings page", "Your statement is ready"]
        }
      }
    }
  }
}
```
