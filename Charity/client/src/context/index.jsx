import React, { useContext, createContext } from 'react';
import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';


const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract('0x5F99a3562a03E6C3cff0F7d9C564fD3c2f6D72aD');
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
        args: [
          address,
          form.title,
          form.description,
          form.target,
          new Date(form.deadline).getTime(),
          form.image,
        ],
      });
      console.log("Contract call success", data);
    } catch (error) {
      console.error("Contract call failure:", error.message || error);
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');
    return campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i,
    }));
 
 
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    return allCampaigns.filter(campaign => campaign.owner === address);
  };

  const donate = async (pId, amount) => {
    const data = await contract.call('donateToCampaign', [pId], { value: ethers.utils.parseEther(amount) });
    return data;
  };

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', [pId]);
    return donations[0].map((donator, i) => ({
      donator,
      donation: ethers.utils.formatEther(donations[1][i].toString()),
    }));
  };

  return (
    <StateContext.Provider value={{ 
      address, 
      contract, 
      connect, 
      createCampaign: publishCampaign, 
      getCampaigns, 
      getUserCampaigns, 
      donate, 
      getDonations 
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStateContext must be used within a StateContextProvider');
  }
  return context;
};



