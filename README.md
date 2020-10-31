# ethereum-resend

Resend(speedup) or cancel ethereum transaction.

# Usage
```
选项：
      --help                  显示帮助信息                                [布尔]
      --version               显示版本号                                  [布尔]
  -k, --privkey               private key used for signing       [字符串] [必需]
  -t, --txhash                transaction hash that needs to be resent
                                                                 [字符串] [必需]
  -p, --provider              web3 provider, e.g ws://127.0.0.1:8550
                                                                 [字符串] [必需]
  -s, --resend                resend the transaction with the same parameters
                                                          [布尔] [默认值: false]
  -c, --cancel                cancel the transaction      [布尔] [默认值: false]
  -g, --gasprice              the gasprice of the new transaction
                                                         [字符串] [默认值: "-1"]
  -n, --gasprice_numerator    the numerator of gasprice  [字符串] [默认值: "-1"]
  -d, --gasprice_denominator  the denominator of gasprice[字符串] [默认值: "-1"]
```

# Example

```
npm i -g ethereum-resend
erd --privkey your_privkey --provider your_provider --cancel -n 2 -d 1 --txhash your_transaction_hash
erd --privkey your_privkey --provider your_provider --resend -n 5 -d 1 --txhash your_transaction_hash
```