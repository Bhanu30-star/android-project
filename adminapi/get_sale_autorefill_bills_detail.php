<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate2  = date("Y-m-d");
	$start_date=$_POST['start_date'];
	$end_date= $_POST['end_date'];
	$pid = isset($_POST['party_id']) ? $_POST['party_id'] : '';
	$check_author1 = mysqli_query($con,"select fabrics_receipt from tbl_distributor where distributor_id='$ver'");
	while($fetch_dis=mysqli_fetch_assoc($check_author1))
	{
		$bill_type_dis=$fetch_dis['fabrics_receipt'];;
	}
	$queryres = "select * from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date>='$start_date' and tbl_party_transaction.transaction_date<='$end_date' and tbl_user.distributor_id='$ver'";
	if($pid!='')
		$queryres=$queryres." "."and tbl_party.party_id='$pid'";
	$queryres=$queryres." "."order by tbl_party_transaction.id DESC";
	$res = mysqli_query($con,$queryres);
	$billbook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$transaction_id=$fetch_product['transaction_id'];
			$billbook['transaction_id']=$fetch_product['transaction_id'];
			$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
			$billbook['transaction_date']=$fetch_product['transaction_date'];
			$billbook['transaction_time']=$fetch_product['transaction_time'];
			$billbook['party_name']=$fetch_product['party_name'];
			$billbook['party_phone']=$fetch_product['party_phone'];
			$billbook['fos_name']=$fetch_product['user_name']."-".$fetch_product['user_phone'];
			$billbook['final_amount']=$fetch_product['final_amt'];
			$billbook['payment_mode']=$fetch_product['payment_mode'];
			$billbook['message_txn_id']=$fetch_product['message_txn_id'];
			$check_product_type='';
			$res_test_product = mysqli_query($con,"select * from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id' order by tbl_party_transaction_detail.transaction_detail_id asc limit 1");    
			while($fetch_test_product=mysqli_fetch_assoc($res_test_product))
			{
				$check_product_type=$fetch_test_product['product_type'];
			}
			if($fetch_product['bill_type']=="Receipt")
			{
				$billbook['receipt_call']="download_receipt_invoice.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
			}
			else if($fetch_product['serial_no_bill']=="Yes")
			{
				$billbook['receipt_call']="download_serialno_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
			}
			else if($check_product_type=="FMCG")
			{
				$billbook['receipt_call']="download-cess-receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
			} 
			else if($bill_type_dis=='Yes')
			{ 
				$billbook['receipt_call']="download_receipt_fabrics.php?id=".$fetch_product['transaction_id']."&user_id=".$ver;
			}
			else
			{
				$billbook['receipt_call']="download_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
			}
			$response['billbook'][]=$billbook;
		}
	}
	else
	{
		$response['billbook']=$billbook;
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>