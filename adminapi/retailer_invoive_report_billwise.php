<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) &&  isset($_POST['distributor_id']))
{
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$cparty=$_POST['searchparty'];
	$cFOS=$_POST['searchFOS'];
	$searchtype=$_POST['ptype'];
	$ver = $_POST['distributor_id'];
	$res = "select * from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type='Tax Invoice' and tbl_party_transaction.generated_by!='Distributor'";
	if($cparty!="")
	{
		$res=$res." "."and (tbl_party.party_name LIKE '".$cparty."%' or tbl_party.party_phone LIKE '".$cparty."%')";
	}
	if($cFOS!="")
	{
		$res=$res." "."and tbl_user.user_id='$cFOS'";
	}
	$res=$res." "."order by tbl_party_transaction.id ASC";
	
	$query3 = mysqli_query($con,$res);
	$billbook=array();
	if(mysqli_num_rows($query3)>0)
	{     
		$flagfinal=1;
		while($fetch_product2=mysqli_fetch_assoc($query3))
		{
			$bill_date=$fetch_product2['transaction_date'];
			$bill_no=$fetch_product2['transaction_bill_number'];
			$sale_type=$fetch_product2['payment_mode'];	
			if($searchtype=='Retailer Name')
				$party_name=$fetch_product2['party_name'];
			else
				$party_name=$fetch_product2['party_phone'];
			$dist_gst_config=$fetch_product2['gst_configure'];
			$mc_name=$fetch_product2['user_name'];	
			$billbook['S.No.']=$bill_no;
			$billbook['bill_date']=$bill_date;
			$billbook['party_name']=$party_name;
			$billbook['place_supply']=$fetch_product2['place_of_supply'];
			$billbook['sale_type']=$sale_type;
			$billbook['gstin_no']=$fetch_product2['gstin_no'];
			$billbook['godown_name']=$mc_name;
			$billbook['total_amount']=$fetch_product2['total_amount'];
			$billbook['disc_amt']=$fetch_product2['disc_amt'];
			$billbook['discount_on_total']=$fetch_product2['discount_on_total'];
			$billbook['cess_amount']=$fetch_product2['cess_amount'];
			$billbook['tcs_percentage']=$fetch_product2['tcs_percentage'];
			$billbook['tcs_amount']=$fetch_product2['tcs_amount'];
			$billbook['labour_charges']=$fetch_product2['labour_charges'];
			$billbook['freight_charges']=$fetch_product2['freight_charges'];
			$billbook['other_expenses']=$fetch_product2['other_expenses'];
			$billbook['final_amt']=$fetch_product2['final_amt'];
			$trans_id=$fetch_product2['transaction_id'];
			$billbook['bill_detail']=array();
			$bill_detail=array();
			$res1 = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as saleprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$trans_id'");
			if(mysqli_num_rows($res1)>0)
			{
				while($fetch_product3=mysqli_fetch_assoc($res1))
				{
					if($fetch_product3['product_name']!="Airtel Money")
					{	
						$sale_total_amt=0;
						$gst_cal=$fetch_product3['saleprice'];
						if($fetch_product3['free_flag']!='Yes')
						{
							if($dist_gst_config=="Inclusive")
							{
								$sale_total_amt =$fetch_product3['quantity']*$fetch_product3['saleprice'];
								$gst_cal=round(($fetch_product3['saleprice']/((100+$fetch_product3['CGST']+$fetch_product3['SGST'])/100)),4);
							}
							else
							{
								$sale_total_amt =$fetch_product3['quantity']*$fetch_product3['saleprice']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount']+$fetch_product3['cess_final_amt'];
							}
						}
						
						$total_disc_val=$total_disc_val+$fetch_product3['product_disc'];
						$total_bill_amt=$total_bill_amt+$sale_total_amt;
						$bill_detail['free_flag']=$fetch_product3['free_flag'];
						$bill_detail['product_name']=$fetch_product3['product_name'];
						$bill_detail['unit']=$fetch_product3['sale_unit'];
						$bill_detail['quantity']=$fetch_product3['quantity'];
						$bill_detail['IMEI_NO']=$fetch_product3['IMEI_NO'];
						$bill_detail['bag_type']=$fetch_product3['bag_type'];
						$bill_detail['bag_qty']=$fetch_product3['bag_qty'];
						$bill_detail['product_type']=$fetch_product3['product_type'];
						$bill_detail['rate']=$gst_cal;
						$bill_detail['amount']=round($sale_total_amt,2);
						$bill_detail['discount']=$fetch_product3['product_disc'];
						$bill_detail['net_amt']=round($sale_total_amt-$fetch_product3['product_disc'],2);
						$bill_detail['tax_rate']=$fetch_product3['CGST']+$fetch_product3['SGST'];
						$bill_detail['primary_unit']=$fetch_product3['unit'];
						$bill_detail['secondary_unit']=$fetch_product3['secondary_unit'];
						
						$res_conversiondetail=mysqli_query($con,"SELECT total_unit FROM tbl_product_conversion_unit WHERE product_id='".$fetch_product3['product_id']."' and status='Active' and primary_value ='Yes'");
						if(mysqli_num_rows($res_conversiondetail)>0)
						{
							while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
							{
								$bill_detail['primary_total_unit']= $fetch_consume['total_unit'];
							}
						}
						else
						{
							$bill_detail['primary_total_unit']= '0';
						}
						$billbook['bill_detail'][]=$bill_detail;
					}
				}
				$response['billbook'][]=$billbook;
			}
		}
	}
	if($flagfinal==1)
	{		
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Bill not available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>