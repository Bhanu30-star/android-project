<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country,serialno_configuration FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		$response['serialno_configuration']=$disRow['serialno_configuration'];
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_imei']=$fetch_user['imei_no'];
		}
	}
	else
	{
		$response['user_imei']='';
	}
	$product=array();
	$select_product = mysqli_query($con,"select *,tbl_bill_generation_process_support.status as processstatus from tbl_product,tbl_bill_generation_process_support,tbl_party where tbl_product.product_id = tbl_bill_generation_process_support.product_id and tbl_bill_generation_process_support.party_id=tbl_party.party_id and tbl_bill_generation_process_support.status in ('Pending','Complete') and tbl_bill_generation_process_support.distributor_id='$dis_id' order by tbl_bill_generation_process_support.id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['request_id']=$fetch_product['request_id'];
			$product['party_name']=$fetch_product['party_name'];
			$product['bill_date']=$fetch_product['bill_date'];
			$product['payment_mode']=$fetch_product['payment_mode'];
			$product['tax_type']=$fetch_product['tax_type'];
			$product['product_name']=$fetch_product['product_name'];
			$product['product_id']=$fetch_product['product_id'];
			$product['amount']=$fetch_product['amount'];
			$product['status']=$fetch_product['processstatus'];
			if($fetch_product['processstatus']=='Complete')
			{
				$fetch_bill = mysqli_query($con,"select transaction_id FROM `tbl_party_transaction` where transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id') and message_txn_id='".$fetch_product['request_id']."'");
				$fetch_bill_req=mysqli_fetch_array($fetch_bill);
				$product['url'] = "download_invoice_pdf.php?id=" . $fetch_bill_req['transaction_id'] . "&user_id=" . $dis_id . "&lng=eng";
				
				$check_dist = mysqli_query($con,"select * from tbl_distributor where distributor_id='$dis_id' and einvoice_applicable='Yes'");
				if(mysqli_num_rows($check_dist)>0 && $fetch_bill_req['party_gstin']!='')
				{ 
					$extra_link1 = 'tbl_party_einvoice';
					$fetch_bill_einvoice=mysqli_query($con,"select * FROM `tbl_party_einvoice` where invoice_id='".$fetch_bill_req['transaction_id']."' and `distributor_id`='$dis_id' and sttaus='Complete' and Irn!=''");
					if(mysqli_num_rows($fetch_bill_einvoice)>0)
					{
						$fetch_product2=mysqli_fetch_array($fetch_bill_einvoice);
						$product['einvoice_url'] ="download-einvoice-pdf.php?txnid=".base64_encode($fetch_product2['transaction_id'])."&distid=".base64_encode($dis_id)."&datautable=".base64_encode($extra_link1);
					}
					else
					{
						$product['einvoice_url'] = '';
					}
				}
				else
				{
					$product['einvoice_url'] = '';
				}
			}
			else
			{
				$product['url'] = '';
				$product['einvoice_url'] = '';
			}
			$response['product'][]=$product;
		}
	}
	else
	{
		$response['product']=$product;
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!!";
}	
echo json_encode($response);
?>