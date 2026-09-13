# Uber Direct sandbox como entrega local

## Resultado

Adicionar a Uber Direct às opções atuais de frete para itens elegíveis e destinos entre os CEPs `53000000` e `55999999`. Dentro da faixa, SuperFrete/contingência e Uber Direct aparecem juntas; fora dela, o comportamento atual permanece igual.

## Configuração e segurança

- Manter `UBER_DIRECT_CUSTOMER_ID`, `UBER_DIRECT_CLIENT_ID` e `UBER_DIRECT_CLIENT_SECRET` exclusivamente no cofre e em código executado no servidor.
- Fixar os endpoints de autenticação e cotação no ambiente sandbox da Uber Direct; não criar seleção de ambiente nem caminho para produção no painel.
- Adicionar à configuração de frete apenas ativação da Uber Direct e CEP local inicial/final, sem qualquer coluna ou campo de credencial.
- Exibir no painel somente o status das três credenciais e a indicação de ambiente de teste.
- Preservar autenticação e verificação administrativa em toda leitura e alteração da configuração.

## Cotação

- Implementar OAuth2 `client_credentials` no servidor e guardar o token somente em memória até pouco antes de sua expiração.
- Consultar a cotação da Uber Direct com timeout de 8 segundos usando origem da loja, destino informado e itens elegíveis.
- Executar Uber Direct em paralelo com a cotação normal quando o CEP estiver na faixa local.
- Mesclar a cotação válida na lista existente sem mudar os campos de `ShippingOption`.
- Em ausência de credenciais, timeout, resposta inválida ou erro da Uber, omitir apenas a opção Uber Direct e preservar SuperFrete/contingência.
- Não consultar a Uber Direct fora da faixa configurada nem quando o carrinho tiver somente itens para retirada.

## Checkout e fechamento

- Enviar o endereço necessário para a cotação local sem aceitar preço calculado pelo navegador.
- Mostrar “Uber Direct” como entrega no mesmo dia junto às demais opções disponíveis.
- Repetir a cotação completa no servidor ao fechar o pedido e aceitar somente uma opção retornada naquele recálculo.
- Persistir no pedido o identificador, serviço, transportadora, valor e prazo retornados pelo servidor, usando os campos atuais.

## Painel

- Acrescentar à seção Frete os controles de ativação e faixa de CEP local.
- Mostrar badges “Uber Direct configurada/não configurada” e “Sandbox”, sem revelar ou aceitar credenciais.

## Verificação

- Testar destinos dentro e fora da faixa, carrinho elegível, somente retirada e misto.
- Simular falha/timeout da Uber e confirmar que as demais opções continuam disponíveis.
- Confirmar cache do OAuth, uso exclusivo do sandbox, recálculo no fechamento e ausência de credenciais nos arquivos e respostas ao navegador.
- Validar checkout e painel em desktop e celular, além dos testes de tipos e do fluxo público sem sessão.
