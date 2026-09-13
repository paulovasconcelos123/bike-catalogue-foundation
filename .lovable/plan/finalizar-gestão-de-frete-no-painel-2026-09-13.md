# Finalizar gestão de frete no painel

## Resultado

Polir a seção **Frete** do painel para tornar as tarifas fáceis e seguras de administrar, mantendo a credencial da SuperFrete exclusivamente no cofre de segredos.

## Implementação

- Ordenar as tarifas de contingência de forma determinística por CEP inicial, CEP final e faixa de peso.
- Validar no servidor os limites de CEP e peso, rejeitando faixas invertidas e qualquer sobreposição com outra tarifa ativa ou inativa; ao editar, ignorar a própria tarifa.
- Repetir validações básicas no formulário para dar retorno imediato antes do envio.
- Manter confirmação antes da exclusão, com identificação clara da tarifa, tratamento de erro e bloqueio enquanto a exclusão estiver em andamento.
- Manter apenas o badge “SuperFrete configurada/não configurada”; não criar campo, coluna ou operação para visualizar ou alterar o token.
- Preservar `requireSupabaseAuth` e `assertAdmin(context)` em todas as leituras e escritas de frete.

## Verificação

- Confirmar criação, edição, ordenação e exclusão de tarifas.
- Confirmar rejeição de faixas de CEP/peso inválidas ou sobrepostas.
- Confirmar que nenhum valor de token aparece ou é aceito na interface e que o status continua vindo apenas de `SUPERFRETE_TOKEN`.
