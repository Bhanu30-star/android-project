<?php
include("../../connect.php");
$response = array();
$Body = array();
$itemList = array();
if(isset($_POST['distributor_id']) && isset($_POST['transaction_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$transaction_id=$_POST['transaction_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$ctime  = date("H:i:s");
	$current_dtime=date("Y-m-d H:i:s");

	$select_detail=mysqli_query($con,"SELECT * FROM tbl_party_eway where distributor_id='$session_dist_ver' and transaction_id='$transaction_id'");
	if(mysqli_num_rows($select_detail)>0)
	{     
		$fetch_user_message=mysqli_fetch_assoc($select_detail);
		
		$Body['supplyType']=$fetch_user_message['supplyType'];
		$Body['subSupplyType']=$fetch_user_message['subSupplyType'];
		$Body['subSupplyDesc']=$fetch_user_message['subSupplyDesc'];
		$Body['doctype']=$fetch_user_message['document_type'];
		$Body['docNo']=$fetch_user_message['document_no'];
		$Body['docDate']=date("d/m/Y", strtotime($fetch_user_message['document_date']));
		$Body['fromGstin']=$fetch_user_message['seller_gstin'];
		if($fetch_user_message['seller_trade']!='')
			$Body['fromTrdName']=$fetch_user_message['seller_trade'];
		else
			$Body['fromTrdName']=null;
		$Body['fromAddr1']=$fetch_user_message['seller_address1'];
		if($fetch_user_message['seller_address2']!='')
			$Body['fromAddr2']=$fetch_user_message['seller_address2'];
		else
			$Body['fromAddr2']=null;
		if($fetch_user_message['seller_place']!='')
			$Body['fromPlace']=$fetch_user_message['seller_place'];
		else
			$Body['fromPlace']=null;
		$Body['fromPincode']=(int)$fetch_user_message['seller_pin'];
		if($fetch_user_message['seller_statecode']!=''){
			$Body['actFromStateCode']=(int)$fetch_user_message['seller_statecode'];
			$Body['fromStateCode']=(int)$fetch_user_message['seller_statecode'];
		}
		else{
			$Body['actFromStateCode']=null;
			$Body['fromStateCode']=null;
		}
		$Body['toGstin']=$fetch_user_message['buyer_gstin'];
		if($fetch_user_message['buyer_trade']!='')
			$Body['toTrdName']=$fetch_user_message['buyer_trade'];
		else
			$Body['toTrdName']=null;
		$Body['toAddr1']=$fetch_user_message['buyer_address1'];
		$Body['toPlace']=$fetch_user_message['buyer_place'];
		$Body['toPincode']=(int)$fetch_user_message['buyer_pin'];
		$Body['actToStateCode']=(int)$fetch_user_message['buyer_statecode'];
		$Body['toStateCode']=(int)$fetch_user_message['buyer_statecode'];
		$Body['transactionType']=(int)$fetch_user_message['transactionType'];

		$select_item_detail=mysqli_query($con,"SELECT * FROM tbl_party_eway_detail where transaction_id='$transaction_id'");
		if(mysqli_num_rows($select_item_detail)>0)
		{     
			$c=1;
			while($fetch_item_data=mysqli_fetch_assoc($select_item_detail))
			{
				$itemList['SNo']=(string)$c++;
				$itemList['productName']=$fetch_item_data['product_name'];
				$itemList['productDesc']=$fetch_item_data['product_name'];
				$itemList['hsnCode']=$fetch_item_data['hsn_code'];
				$itemList['quantity']=floatval($fetch_item_data['quantity']);
				$itemList['qtyUnit']='PCS';
				$gstrt=$fetch_item_data['gst_perc'];
				if($fetch_item_data['IGST_amount']!='0'){
					$itemList['cgstRate']=0;
					$itemList['sgstRate']=0;
					$itemList['igstRate']=$gstrt;
				}else{
					$cgstt=$gstrt/2;
					$itemList['cgstRate']=floatval($cgstt);
					$itemList['sgstRate']=$cgstt;
					$itemList['igstRate']=0;
				}
				if($fetch_item_data['cess_percentage']>0)
				{
					$itemList['cessRate']=floatval($fetch_item_data['cess_percentage']);
					$ItemList['cessNonAdvol']=floatval($fetch_item_data['cess_final_amt']);
				}
				else
				{
					$itemList['cessRate']=0;
					$itemList['cessNonAdvol']=0;
				}
				$itemList['taxableAmount']=floatval($fetch_item_data['net_amount']);
				$Body['itemList'][]=$itemList;
			}
		}
		$Body['otherValue']=floatval($fetch_user_message['doc_other_charges']);
		$Body['totalValue']=floatval($fetch_user_message['doc_total_value']);
		$Body['cgstValue']=floatval($fetch_user_message['doc_cgst_amt']);
		$Body['sgstValue']=floatval($fetch_user_message['doc_sgst_amt']);
		$Body['igstValue']=floatval($fetch_user_message['doc_igst_amt']);
		$Body['cessValue']=floatval($fetch_user_message['doc_cess_amt']);
		$Body['cessNonAdvolValue']=floatval($fetch_user_message['doc_nonadvol_amt']);
		$Body['totInvValue']=floatval($fetch_user_message['total_inv_vaue']);
		$Body['transporterId']=$fetch_user_message['transporter_id'];
		$Body['transporterName']=$fetch_user_message['transporterName'];
		$Body['transDocNo']=$fetch_user_message['transDocNo'];
		$Body['transMode']=$fetch_user_message['transMode'];
		$Body['transDistance']=$fetch_user_message['transDistance'];
		$Body['transDocDate']=date("d/m/Y", strtotime($fetch_user_message['transDocDate']));
		$Body['vehicleNo']=$fetch_user_message['vehicleNo'];
		$Body['vehicleType']=$fetch_user_message['vehicleType'];
		include("../client_eway_json_upload_.php");
		$SendSequence=new SendSequence();
		$system_gen='';
		$sd=$SendSequence->fetch_token($session_dist_ver,$con,$Body,$transaction_id,$system_gen);
		
		if($sd==1)
		{
			$response['success']='1';
			$response['details']="E-Way Detail Successfully Uploaded...!!";
		}
		else
		{
			$response['success']='0';
			$response['details']=$sd;
		}	
	}
	else
	{
		$response['success']='0';
		$response['details']="Detail Not Valid";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>