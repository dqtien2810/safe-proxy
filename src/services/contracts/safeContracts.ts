import {
  getFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  type SingletonDeployment,
} from '@gnosis.pm/safe-deployments'
import { LATEST_SAFE_VERSION } from '@/config/constants'
import { Contract } from 'ethers'
import { Interface } from '@ethersproject/abi'
import semverSatisfies from 'semver/functions/satisfies'
import { SafeInfo, type ChainInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import type { GetContractProps, SafeVersion } from '@gnosis.pm/safe-core-sdk-types'
import { type Compatibility_fallback_handler } from '@/types/contracts/Compatibility_fallback_handler'
import { createEthersAdapter, isValidSafeVersion } from '@/hooks/coreSDK/safeCoreSDK'

export const _getValidatedGetContractProps = (
  chainId: string,
  safeVersion: string,
): Pick<GetContractProps, 'chainId' | 'safeVersion'> => {
  if (!isValidSafeVersion(safeVersion)) {
    throw new Error(`${safeVersion} is not a valid Safe version`)
  }

  // TODO: Implement in Core SDK
  // Remove '+L2'/'+Circles' metadata from version
  const [noMetadataVersion] = safeVersion.split('+')

  return {
    chainId: +chainId,
    safeVersion: noMetadataVersion as SafeVersion,
  }
}

// GnosisSafe

export const getSpecificGnosisSafeContractInstance = (safe: SafeInfo) => {
  const ethAdapter = createEthersAdapter()

  return ethAdapter.getSafeContract({
    customContractAddress: safe.address.value,
    ..._getValidatedGetContractProps(safe.chainId, safe.version),
  })
}

export const _getSafeContractDeployment = (chain: ChainInfo, safeVersion: string): SingletonDeployment | undefined => {
  // We check if version is prior to v1.0.0 as they are not supported but still we want to keep a minimum compatibility
  const useOldestContractVersion = semverSatisfies(safeVersion, '<1.0.0')

  // We had L1 contracts in three L2 networks, xDai, EWC and Volta so even if network is L2 we have to check that safe version is after v1.3.0
  const useL2ContractVersion = chain.l2 && semverSatisfies(safeVersion, '>=1.3.0')
  const getDeployment = useL2ContractVersion ? getSafeL2SingletonDeployment : getSafeSingletonDeployment
  return (
    getDeployment({
      version: safeVersion,
      network: chain.chainId,
    }) ||
    getDeployment({
      version: safeVersion,
    }) ||
    // In case we couldn't find a valid deployment and it's a version before 1.0.0 we return v1.0.0 to allow a minimum compatibility
    (useOldestContractVersion
      ? getDeployment({
          version: '1.0.0',
        })
      : undefined)
  )
}

export const getGnosisSafeContractInstance = (chain: ChainInfo, safeVersion: string = LATEST_SAFE_VERSION) => {
  const ethAdapter = createEthersAdapter()

  return ethAdapter.getSafeContract({
    singletonDeployment: _getSafeContractDeployment(chain, safeVersion),
    ..._getValidatedGetContractProps(chain.chainId, safeVersion),
    customContractAddress:"0x5032CE064D481501E6b4a5Cc10D64e6482538948"
  })
}

// MultiSend

const getMultiSendContractDeployment = (chainId: string) => {
  return getMultiSendDeployment({ network: chainId }) || getMultiSendDeployment()
}

export const getMultiSendContractAddress = (chainId: string): string | undefined => {
  const deployment = getMultiSendContractDeployment(chainId)

  return deployment?.networkAddresses[chainId]
}

export const getMultiSendContractInstance = (chainId: string, safeVersion: string = LATEST_SAFE_VERSION) => {
  const ethAdapter = createEthersAdapter()

  return ethAdapter.getMultiSendContract({
    singletonDeployment: getMultiSendContractDeployment(chainId),
    ..._getValidatedGetContractProps(chainId, safeVersion),
  })
}

// MultiSendCallOnly

const getMultiSendCallOnlyContractDeployment = (chainId: string) => {
  return getMultiSendCallOnlyDeployment({ network: chainId }) || getMultiSendCallOnlyDeployment()
}

export const getMultiSendCallOnlyContractAddress = (chainId: string): string | undefined => {
  const deployment = getMultiSendCallOnlyContractDeployment(chainId)

  return deployment?.networkAddresses[chainId]
}

export const getMultiSendCallOnlyContractInstance = (chainId: string, safeVersion: string = LATEST_SAFE_VERSION) => {
  const ethAdapter = createEthersAdapter()

  return ethAdapter.getMultiSendCallOnlyContract({
    singletonDeployment: getMultiSendCallOnlyContractDeployment(chainId),
    ..._getValidatedGetContractProps(chainId, safeVersion),
  })
}

// GnosisSafeProxyFactory

const getProxyFactoryContractDeployment = (chainId: string) => {
  return (
    getProxyFactoryDeployment({
      version: LATEST_SAFE_VERSION,
      network: chainId,
    }) ||
    getProxyFactoryDeployment({
      version: LATEST_SAFE_VERSION,
    })
  )
}

export const getProxyFactoryContractInstance = (chainId: string, safeVersion: string = LATEST_SAFE_VERSION) => {
  const ethAdapter = createEthersAdapter()
  const a= getProxyFactoryContractDeployment(chainId)
  if(a){
    a.networkAddresses[920000]='0x5032CE064D481501E6b4a5Cc10D64e6482538948'
    a.defaultAddress = '0x5032CE064D481501E6b4a5Cc10D64e6482538948'
  }
console.log('a', a, _getValidatedGetContractProps(chainId, safeVersion))
 try {
  return ethAdapter.getSafeProxyFactoryContract({
    singletonDeployment:a,
    ..._getValidatedGetContractProps(chainId, safeVersion),
  })
 } catch (error) {
    console.log('error', error)
 }  
}

// Fallback handler

const getFallbackHandlerContractDeployment = (chainId: string) => {
  return (
    getFallbackHandlerDeployment({
      version: LATEST_SAFE_VERSION,
      network: chainId,
    }) ||
    getFallbackHandlerDeployment({
      version: LATEST_SAFE_VERSION,
    })
  )
}

// TODO: Yet to be implemented in Core SDK
export const getFallbackHandlerContractInstance = (chainId: string): Compatibility_fallback_handler => {
  const fallbackHandlerDeployment = getFallbackHandlerContractDeployment(chainId)
  console.log('first', fallbackHandlerDeployment, chainId)
  if (!fallbackHandlerDeployment) {
    throw new Error(`FallbackHandler contract not found for chainId: ${chainId}`)
  }
if(fallbackHandlerDeployment){
  fallbackHandlerDeployment.networkAddresses[920000]= "0x5032CE064D481501E6b4a5Cc10D64e6482538948"
}
  const contractAddress = fallbackHandlerDeployment.networkAddresses[chainId]

  return new Contract(contractAddress, new Interface(fallbackHandlerDeployment.abi)) as Compatibility_fallback_handler
}
