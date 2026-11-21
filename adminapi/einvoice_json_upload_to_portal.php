<?php
$response = array();
include("../../connect.php");
if(isset($_POST['transaction_id']) && isset($_POST['distributor_id']))
{  
	$transaction_id = $_POST['transaction_id'];
	$session_dist_ver = $_POST['distributor_id'];
	
	$select_detail=mysqli_query($con,"SELECT * FROM tbl_party_einvoice where distributor_id='$session_dist_ver' and transaction_id='$transaction_id' and status='Pending'");
	if(mysqli_num_rows($select_detail)>0)
	{     
		$fetch_user_message=mysqli_fetch_assoc($select_detail);
		$response['Version']=$fetch_user_message['version'];
		
		$TranDtls['TaxSch']=$fetch_user_message['taxsch'];
		$TranDtls['SupTyp']=$fetch_user_message['transaction_category'];
		$TranDtls['IgstOnIntra']=$fetch_user_message['igst_intra'];
		$TranDtls['RegRev']=$fetch_user_message['reverse_charges'];
		if($fetch_user_message['ecommerce_gstin']!='')
			$TranDtls['EcmGstin']=$fetch_user_message['ecommerce_gstin'];
		else
			$TranDtls['EcmGstin']=null;
		$response['TranDtls']=$TranDtls;
		
		$DocDtls['Typ']=$fetch_user_message['document_type'];
		$DocDtls['No']=$fetch_user_message['document_no'];
		$DocDtls['Dt']=date("d/m/Y", strtotime($fetch_user_message['document_date']));
		$response['DocDtls']=$DocDtls;
		
		$source_url=$source_url.'?searchsubmitd='.$fetch_user_message['document_date'];
		
		$SellerDtls['Gstin']=$fetch_user_message['seller_gstin'];
		$SellerDtls['LglNm']=$fetch_user_message['seller_legal_name'];
		if($fetch_user_message['seller_trade']!='')
			$SellerDtls['TrdNm']=$fetch_user_message['seller_trade'];
		else
			$SellerDtls['TrdNm']=null;
		$SellerDtls['Addr1']=$fetch_user_message['seller_address1'];
		if($fetch_user_message['seller_address2']!='')
			$SellerDtls['Addr2']=$fetch_user_message['seller_address2'];
		else
			$SellerDtls['Addr2']=null;
		
		if($fetch_user_message['seller_location']!='')
			$SellerDtls['Loc']=$fetch_user_message['seller_location'];
		else
			$SellerDtls['Loc']=null;
		$SellerDtls['Pin']=(int)$fetch_user_message['seller_pin'];
		if($fetch_user_message['seller_statecode']!='')
			$SellerDtls['Stcd']=$fetch_user_message['seller_statecode'];
		else
			$SellerDtls['Stcd']=null;
		$SellerDtls['Ph']=$fetch_user_message['seller_phone'];
		$SellerDtls['Em']=$fetch_user_message['seller_email'];
		$response['SellerDtls']=$SellerDtls;
		
		$BuyerDtls['Gstin']=$fetch_user_message['buyer_gstin'];
		$BuyerDtls['LglNm']=$fetch_user_message['buyer_legalname'];
		if($fetch_user_message['buyer_trade']!='')
			$BuyerDtls['TrdNm']=$fetch_user_message['buyer_trade'];
		else
			$BuyerDtls['TrdNm']=null;
		$BuyerDtls['Pos']=$fetch_user_message['buyer_place_supply'];
		$BuyerDtls['Addr1']=$fetch_user_message['buyer_address1'];
		if($fetch_user_message['buyer_address2']!='')
			$BuyerDtls['Addr2']=$fetch_user_message['buyer_address2'];
		else
			$BuyerDtls['Addr2']=null;
		$BuyerDtls['Loc']=$fetch_user_message['buyer_location'];
		$BuyerDtls['Pin']=(int)$fetch_user_message['buyer_pin'];
		$BuyerDtls['Stcd']=$fetch_user_message['buyer_statecode'];
		if($fetch_user_message['buyer_phone']!='')
			$BuyerDtls['Ph']=$fetch_user_message['buyer_phone'];
		else
			$BuyerDtls['Ph']=null;
		$BuyerDtls['Em']=null;
		$response['BuyerDtls']=$BuyerDtls;
		
		$response['DispDtls']=null;
		$response['ShipDtls']=null;
		
		$select_item_detail=mysqli_query($con,"SELECT * FROM tbl_party_einvoice_detail where transaction_id='$transaction_id'");
		if(mysqli_num_rows($select_item_detail)>0)
		{     
			$c=1;
			while($fetch_item_data=mysqli_fetch_assoc($select_item_detail))
			{
				$ItemList['SlNo']=(string)$c++;
				$ItemList['PrdDesc']=$fetch_item_data['product_name'];
				
				$select_item_hsncode=mysqli_query($con,"SELECT * FROM tbl_party_einvoice_service_hsncode where hsn_code='".$fetch_item_data['hsn_code']."'");
				if(mysqli_num_rows($select_item_hsncode)>0)
				{
					$ItemList['IsServc']='Y';
				}
				else
				{
					$ItemList['IsServc']='N';
				}
				$ItemList['HsnCd']=$fetch_item_data['hsn_code'];
				if($fetch_item_data['IMEI_NO']!="")
					$ItemList['Barcde']=$fetch_item_data['IMEI_NO'];
				else
					$ItemList['Barcde']=null;
				$ItemList['Qty']=$fetch_item_data['quantity'];
				$ItemList['Unit']='PCS';
				$ItemList['UnitPrice']=$fetch_item_data['product_price'];
				$ItemList['TotAmt']=$fetch_item_data['product_total_amt'];
				$ItemList['Discount']=$fetch_item_data['product_disc'];
				$ItemList['AssAmt']=$fetch_item_data['assess_amount'];
				$ItemList['GstRt']=$fetch_item_data['gst_perc'];
				$ItemList['IgstAmt']=$fetch_item_data['IGST_amount'];
				$ItemList['SgstAmt']=$fetch_item_data['SGST_amount'];
				$ItemList['CgstAmt']=$fetch_item_data['CGST_amount'];
				if($fetch_item_data['cess_percentage']>0)
				{
					$ItemList['CesRt']=$fetch_item_data['cess_percentage'];
					$ItemList['CesAmt']=$fetch_item_data['cess_final_amt'];
				}
				else
				{
					$ItemList['CesRt']=0;
					$ItemList['CesAmt']=0;
				}
				$ItemList['TotItemVal']=$fetch_item_data['net_amount'];
				$response['ItemList'][]=$ItemList;
			}
		}
		
		$ValDtls['AssVal']=$fetch_user_message['doc_assess_amount'];
		$ValDtls['CgstVal']=$fetch_user_message['doc_cgst_amt'];
		$ValDtls['SgstVal']=$fetch_user_message['doc_sgst_amt'];
		$ValDtls['IgstVal']=$fetch_user_message['doc_igst_amt'];
		$ValDtls['CesVal']=$fetch_user_message['doc_cess_amt'];
		$ValDtls['StCesVal']=0;
		$ValDtls['Discount']=$fetch_user_message['doc_discount_amt'];
		$ValDtls['OthChrg']=$fetch_user_message['doc_other_charges'];
		$ValDtls['RndOffAmt']=0;
		$ValDtls['TotInvValFc']=0;
		$ValDtls['TotInvVal']=$fetch_user_message['doc_item_amount'];
		$response['ValDtls']=$ValDtls;
		//echo json_encode($response);
		
		
		include("../client_einvoice_json_generation_upload.php");
		$SendSequence=new SendSequence();
		$system_gen='';
		$sd=$SendSequence->fetch_token($session_dist_ver,$con,$response,$transaction_id,$system_gen);
		
		if($sd==1)
		{
			$response['success']=1;
			$response['details']="E-Invoice Detail Successfully Uploaded...!!";
		}
		else if($sd=='Error')
		{
			$response['success']=0;
			$response['details']="E-Invoice Detail Not Correct.Please check again and try again later...!!";
		}
		else if($sd=='Error User')
		{
			$response['success']=0;
			$response['details']="Invalid E-Invoice UserName & Pssaword...!!";
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="E-Invoice Already Generated...!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 