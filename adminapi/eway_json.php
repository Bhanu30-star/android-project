<?php

class EwayBills 
{
	var $response = array();
	var $billLists = array();
	var $jsonData = array();

	var $userGstin='',$supplyType='',$docType='',$docNo='',$docDate='',$fromGstin='',$toGstin='',$transportedId='',$transDocNo='',$transDocDate='',$vehicleNo='',$vehicleType='',$fromTrdName='',$fromAddr1='',$fromAddr2='',$fromPlace='',$toTrdName='',$toAddr1='',$toAddr2='',$toPlace='',$transporterName='';

	var $subSupplyType=0,$fromPincode=0,$fromStateCode=0,$actualFromStateCode=0,$transType=0,$toPincode=0,$toStateCode=0,$actualToStateCode=0,$totInvValue=0,$transDistance=0,$transMode=0,$totalValue=0,$cgstValue=0,$sgstValue=0,$igstValue=0,$cessValue=0,$TotNonAdvolVal=0,$OthValue=0,$mainHsnCode=0;

	function setOptionalParams($fromTrdName_1,$fromAddr1_1,$fromAddr2_1,$fromPlace_1,$toTrdName_1,$toAddr1_1,$toAddr2_1,$toPlace_1,$transporterName_1,$totalValue_1,$cgstValue_1,$sgstValue_1,$igstValue_1,$cessValue_1,$TotNonAdvolVal_1,$OthValue_1,$mainHsnCode_1){
		$this->fromTrdName = $fromTrdName_1;
		$this->fromAddr1 = $fromAddr1_1;
		$this->fromAddr2 = $fromAddr2_1;
		$this->fromPlace = $fromPlace_1;
		$this->toTrdName = $toTrdName_1;
		$this->toAddr1 = $toAddr1_1;
		$this->toAddr2 = $toAddr2_1;
		$this->toPlace = $toPlace_1;
		$this->transporterName = $transporterName_1;
		$this->totalValue = $totalValue_1;
		$this->cgstValue = $cgstValue_1;
		$this->sgstValue = $sgstValue_1;
		$this->igstValue = $igstValue_1;
		$this->cessValue = $cessValue_1;
		$this->TotNonAdvolVal = $TotNonAdvolVal_1;
		$this->OthValue = $OthValue_1;
		$this->mainHsnCode = $mainHsnCode_1;
	}

	function setMandatoryParams($userGstin_1,$supplyType_1,$docType_1,$docNo_1,$docDate_1,$fromGstin_1,$toGstin_1,$jsonData_1,$toPincode_1,$toStateCode_1,$actualToStateCode_1,$totInvValue_1,$transDistance_1,$transMode_1,$subSupplyType_1,$fromPincode_1,$fromStateCode_1,$actualFromStateCode_1,$transType_1){

		$this->userGstin = $userGstin_1;
		$this->supplyType = $supplyType_1;
		$this->docType = $docType_1;
		$this->docNo = $docNo_1;
		$this->docDate = $docDate_1;
		$this->fromGstin = $fromGstin_1;
		$this->toGstin = $toGstin_1;
		$this->jsonData = $jsonData_1;
		$this->toPincode = $toPincode_1;
		$this->toStateCode = $toStateCode_1;
		$this->actualToStateCode = $actualToStateCode_1;
		$this->totInvValue = $totInvValue_1;
		$this->transDistance = $transDistance_1;
		$this->transMode = $transMode_1;
		$this->subSupplyType = $subSupplyType_1;
		$this->fromPincode = $fromPincode_1;
		$this->fromStateCode = $fromStateCode_1;
		$this->actualFromStateCode = $actualFromStateCode_1;
		$this->transType = $transType_1;
	}

	function setConditionalParams($transportedId_1,$transDocNo_1,$transDocDate_1,$vehicleNo_1,$vehicleType_1){

		$this->transportedId = $transportedId_1;
		$this->transDocNo = $transDocNo_1;
		$this->transDocDate = $transDocDate_1;
		$this->vehicleNo = $vehicleNo_1;
		$this->vehicleType = $vehicleType_1;
	}

	function prepareJSON(){
		$billLists['userGstin'] = $this->userGstin;
		$billLists['supplyType'] = $this->supplyType;
		$billLists['subSupplyType'] = $this->subSupplyType;
		$billLists['docType'] = $this->docType;
		$billLists['docNo'] = $this->docNo;
		$billLists['docDate'] = $this->docDate;
		$billLists['transType'] = $this->transType;
		$billLists['fromGstin'] = $this->fromGstin;
		$billLists['fromTrdName'] = $this->fromTrdName;
		$billLists['fromAddr1'] = $this->fromAddr1;
		$billLists['fromAddr2'] = $this->fromAddr2;
		$billLists['fromPlace'] = $this->fromPlace;
		$billLists['fromPincode'] = $this->fromPincode;
		$billLists['fromStateCode'] = $this->fromStateCode;
		$billLists['actualFromStateCode'] = $this->actualFromStateCode;
		$billLists['toGstin'] = $this->toGstin;
		$billLists['toTrdName'] = $this->toTrdName;

		$billLists['toAddr1'] = $this->toAddr1;
		$billLists['toAddr2'] = $this->toAddr2;
		$billLists['toPlace'] = $this->toPlace;
		$billLists['toPincode'] = $this->toPincode;
		$billLists['toStateCode'] = $this->toStateCode;
		$billLists['actualToStateCode'] = $this->actualToStateCode;
		$billLists['totalValue'] = $this->totalValue;
		$billLists['cgstValue'] = $this->cgstValue;
		$billLists['sgstValue'] = $this->sgstValue;
		$billLists['igstValue'] = $this->igstValue;
		$billLists['cessValue'] = $this->cessValue;
		$billLists['TotNonAdvolVal'] = $this->TotNonAdvolVal;
		$billLists['OthValue'] = $this->OthValue;
		$billLists['totInvValue'] = $this->totInvValue;
		$billLists['transMode'] = $this->transMode;
		$billLists['transDistance'] = $this->transDistance;
		$billLists['transporterName'] = $this->transporterName;

		$billLists['transporterId'] = $this->transportedId;
		$billLists['transDocNo'] = $this->transDocNo;
		$billLists['transDocDate'] = $this->transDocDate;
		$billLists['vehicleNo'] = $this->vehicleNo;
		$billLists['vehicleType'] = $this->vehicleType;
		$billLists['mainHsnCode'] = $this->mainHsnCode;

		$billLists['itemList'] = $this->jsonData;
		
		$response['version']='1.0.0219';
		$response['billLists'][]=$billLists;
		
		return json_encode($response);

// echo $this->userGstin."\n".$this->mainHsnCode."\n".$this->transportedId."\n"."\n";
// echo gettype($this->userGstin)."\n".gettype($this->mainHsnCode)."\n".gettype($this->transportedId);
	}
}
?>